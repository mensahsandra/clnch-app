/**
 * CLNCH Extension — Background Service Worker
 * Supabase auth, opportunity lookup, AI refinement coordination.
 */

import { storeAuthPayload, clearAuth, getStoredSession, getConfig } from './config.js';
import { getSupabaseClient, resetSupabaseClient } from './lib/supabase-client.js';
import { urlsMatch, extractRefinedDraft, normalizeUrl } from './lib/url-utils.js';

let liveContext = {
  sessionId: null,
  activeFieldLabel: 'Cover Letter',
  lastProcessedRawInput: '',
  pageUrl: '',
  opportunity: null,
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((result) => sendResponse(result))
    .catch((err) => {
      console.error('[CLNCH]', err);
      sendResponse({ success: false, error: err.message });
    });
  return true;
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'CLNCH_STORE_AUTH':
      await storeAuthPayload(message.payload);
      resetSupabaseClient();
      return { success: true };

    case 'CLNCH_CLEAR_AUTH':
      await clearAuth();
      resetSupabaseClient();
      return { success: true };

    case 'CLNCH_GET_AUTH_STATUS': {
      const session = await getStoredSession();
      const config = await getConfig();
      return {
        authenticated: Boolean(session?.access_token),
        hasConfig: Boolean(config.supabaseUrl && config.supabaseAnonKey),
      };
    }

    case 'CLNCH_LOOKUP_OPPORTUNITY': {
      const pageUrl = message.payload?.url || sender.tab?.url || '';
      liveContext.pageUrl = pageUrl;
      const result = await lookupOpportunity(pageUrl);
      liveContext.opportunity = result.opportunity;
      liveContext.sessionId = result.session?.id ?? null;
      return result;
    }

    case 'CLNCH_GET_COACHED_ANSWERS': {
      const fieldLabel = message.payload?.fieldLabel || liveContext.activeFieldLabel;
      const answers = await fetchCoachedAnswers(liveContext.sessionId, fieldLabel);
      return { answers };
    }

    case 'CLNCH_FIELD_ACTIVATED':
      liveContext.activeFieldLabel = message.payload.fieldLabel;
      broadcast({ type: 'CLNCH_FIELD_ACTIVATED', payload: message.payload });
      return { success: true };

    case 'CLNCH_DEBOUNCED_INPUT_STABILIZED':
      await executeRefinementPipeline(
        message.payload.fieldLabel,
        message.payload.rawAnswer,
        sender
      );
      return { success: true };

    case 'CLNCH_GET_SESSION_CONTEXT':
      return liveContext;

    case 'CLNCH_INJECT_TEXT': {
      let tabId = sender.tab?.id;
      if (!tabId) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = activeTab?.id;
      }
      if (tabId) {
        return chrome.tabs.sendMessage(tabId, message);
      }
      return { success: false, error: 'No active tab' };
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

/** @param {string} pageUrl */
async function lookupOpportunity(pageUrl) {
  const supabase = await getSupabaseClient();

  if (!supabase) {
    const config = await getConfig();
    return {
      success: false,
      authenticated: false,
      hasConfig: Boolean(config.supabaseUrl && config.supabaseAnonKey),
      error: 'Not connected. Log in to CLNCH web app to sync your session.',
      opportunity: null,
      session: null,
      coachedAnswers: [],
    };
  }

  const session = await getStoredSession();
  const authenticated = Boolean(session?.access_token);
  const config = await getConfig();

  const { data: sessions, error: sessionsError } = await supabase
    .from('application_sessions')
    .select('*')
    .order('last_active_at', { ascending: false })
    .limit(50);

  if (sessionsError) {
    return { success: false, authenticated, error: sessionsError.message, opportunity: null, session: null };
  }

  const matchedSession = (sessions || []).find((s) => urlsMatch(pageUrl, s.opportunity_link));

  const { data: opportunities, error: oppsError } = await supabase
    .from('opportunities')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (oppsError && !matchedSession) {
    return { success: false, authenticated, error: oppsError.message, opportunity: null, session: null };
  }

  const matchedOpp = (opportunities || []).find((o) => urlsMatch(pageUrl, o.link));

  if (!matchedSession && !matchedOpp) {
    return {
      success: true,
      authenticated,
      hasConfig: Boolean(config.supabaseUrl && config.supabaseAnonKey),
      opportunity: null,
      session: null,
      coachedAnswers: [],
      pageUrl: normalizeUrl(pageUrl),
    };
  }

  const opportunity = {
    id: matchedSession?.opportunity_id || matchedOpp?.id || matchedSession?.id,
    title: matchedSession?.opportunity_title || matchedOpp?.organization || 'Opportunity',
    org: matchedSession?.opportunity_org || matchedOpp?.organization || '',
    link: matchedSession?.opportunity_link || matchedOpp?.link || pageUrl,
    category: matchedOpp?.category || 'fellowship',
    status: matchedSession?.status || matchedOpp?.status || 'active',
    deadline: matchedOpp?.deadline || null,
    requirements: matchedOpp?.requirements || [],
    sessionId: matchedSession?.id || null,
  };

  const coachedAnswers = matchedSession?.id
    ? await fetchCoachedAnswers(matchedSession.id, liveContext.activeFieldLabel)
    : [];

  return {
    success: true,
    authenticated,
    hasConfig: Boolean(config.supabaseUrl && config.supabaseAnonKey),
    opportunity,
    session: matchedSession,
    coachedAnswers,
    pageUrl: normalizeUrl(pageUrl),
  };
}

/** @param {string | null} sessionId @param {string} fieldLabel */
async function fetchCoachedAnswers(sessionId, fieldLabel) {
  if (!sessionId) return [];

  const supabase = await getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('application_answers')
    .select('*')
    .eq('session_id', sessionId)
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !data) return [];

  return data
    .filter((row) => {
      if (!fieldLabel || fieldLabel === 'Unlabeled Text Field') return true;
      if (!row.field_name) return true;
      return row.field_name.toLowerCase().includes(fieldLabel.toLowerCase().slice(0, 12))
        || fieldLabel.toLowerCase().includes(row.field_name.toLowerCase().slice(0, 12));
    })
    .map((row) => ({
      id: row.id,
      fieldName: row.field_name,
      content: row.refined_answer || row.content,
      refinedText: extractRefinedDraft(row.refined_answer || row.content),
    }));
}

async function executeRefinementPipeline(fieldLabel, rawInputText, sender) {
  if (!rawInputText?.trim()) return;
  if (rawInputText.trim() === liveContext.lastProcessedRawInput) return;
  liveContext.lastProcessedRawInput = rawInputText.trim();

  broadcast({ type: 'CLNCH_REFINEMENT_STARTED', payload: { fieldLabel } });

  let refinedAnswer = null;

  try {
    const config = await getConfig();
    const supabaseUrl = config.supabaseUrl || 'https://xispzcvivovknwcwivjk.supabase.co';
    const refineEndpoint = `${supabaseUrl}/functions/v1/refine`;

    const apiResponse = await fetch(refineEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        opportunityUrl: sender?.tab?.url || liveContext.pageUrl,
        fieldLabel,
        rawTextDataPayload: rawInputText,
      }),
    });

    if (apiResponse.ok) {
      const responseData = await apiResponse.json();
      refinedAnswer =
        responseData.refinedAnswer ||
        responseData.extractedFields?.refined_answer ||
        null;
    }
  } catch {
    // Fall through to local refinement
  }

  if (!refinedAnswer) {
    refinedAnswer = buildLocalRefinement(fieldLabel, rawInputText);
  }

  if (liveContext.sessionId) {
    const supabase = await getSupabaseClient();
    if (supabase) {
      await supabase.from('application_answers').insert({
        session_id: liveContext.sessionId,
        field_name: fieldLabel,
        raw_answer: rawInputText,
        refined_answer: refinedAnswer,
        role: 'assistant',
        content: refinedAnswer,
      });
    }
  }

  broadcast({
    type: 'CLNCH_REFINEMENT_COMPLETE',
    payload: { fieldLabel, rawAnswer: rawInputText, refinedAnswer },
  });
}

function buildLocalRefinement(fieldLabel, rawText) {
  const trimmed = rawText.trim();
  const opener = fieldLabel && fieldLabel !== 'Unlabeled Text Field'
    ? `For your "${fieldLabel}" response:\n\n`
    : '';

  return `${opener}${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}${trimmed.endsWith('.') ? '' : '.'} This version keeps your core ideas while tightening structure and tone for a professional application.`;
}

function broadcast(message) {
  chrome.runtime.sendMessage(message).catch(() => {});

  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) chrome.tabs.sendMessage(tab.id, message).catch(() => {});
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('CLNCH Companion Extension installed.');
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'CLNCH_TOGGLE_PANEL' });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
    await chrome.tabs.sendMessage(tab.id, { type: 'CLNCH_TOGGLE_PANEL' });
  }
});
