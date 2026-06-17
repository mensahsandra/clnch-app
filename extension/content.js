/**
 * CLNCH Extension — Content Script
 * Floating button, side panel, form detection, text injection, web app bridge.
 */

let inputDebounceTimer = null;
let currentFocusedElement = null;
let panelOpen = false;
let activeFieldLabel = 'Cover Letter';
let latestRefinedAnswer = null;
let isRefining = false;
let opportunityData = null;
let coachedAnswers = [];

window.clnchLastFocusedElement = null;

const CLNCH_HOST_ID = 'clnch-extension-host';
const JOB_URL_PATTERN = /apply|application|careers|jobs|greenhouse|lever|workday|smartrecruiters|bamboohr|ashby/i;

// ─── Form observer (existing behaviour) ───────────────────────────────────

function initializeFormObserver() {
  document.addEventListener('focusin', handleInputFieldFocus, true);
  document.addEventListener('input', handleTextInputChange, true);
  document.addEventListener('focusout', handleInputFieldBlur, true);
}

function handleInputFieldFocus(event) {
  const target = event.target;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    currentFocusedElement = target;
    window.clnchLastFocusedElement = target;
    activeFieldLabel = discoverFieldLabelName(target);
    updateFieldLabelUI(activeFieldLabel);

    chrome.runtime.sendMessage({
      type: 'CLNCH_FIELD_ACTIVATED',
      payload: {
        fieldLabel: activeFieldLabel,
        currentRawValue: target.value || target.innerText || '',
      },
    });
  }
}

function handleInputFieldBlur() {
  // Keep last focused element for injection
}

function handleTextInputChange(event) {
  if (!currentFocusedElement || event.target !== currentFocusedElement) return;
  clearTimeout(inputDebounceTimer);

  const activeRawText = event.target.value || event.target.innerText || '';
  const label = discoverFieldLabelName(event.target);

  inputDebounceTimer = setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'CLNCH_DEBOUNCED_INPUT_STABILIZED',
      payload: { fieldLabel: label, rawAnswer: activeRawText },
    });
  }, 800);
}

function discoverFieldLabelName(element) {
  if (element.id) {
    const connectedLabel = document.querySelector(`label[for="${element.id}"]`);
    if (connectedLabel?.innerText) {
      return connectedLabel.innerText.trim().replace(/[*:]/g, '');
    }
  }

  const ariaLabel = element.getAttribute('aria-label') || element.getAttribute('placeholder');
  if (ariaLabel) return ariaLabel.trim();

  const parentContainer = element.parentElement;
  if (parentContainer) {
    const splitLines = (parentContainer.innerText || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (splitLines.length > 0 && splitLines[0].length < 60) {
      return splitLines[0].replace(/[*:]/g, '');
    }
  }

  return 'Unlabeled Text Field';
}

function injectRefinedTextIntoForm(refinedText) {
  try {
    const targetField = currentFocusedElement || window.clnchLastFocusedElement;
    if (!targetField || targetField === document.body) return false;

    if (targetField.tagName === 'INPUT' || targetField.tagName === 'TEXTAREA') {
      const proto =
        targetField.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value');
      if (setter?.set) setter.set.call(targetField, refinedText);
      else targetField.value = refinedText;
    } else if (targetField.isContentEditable) {
      targetField.innerText = refinedText;
    }

    targetField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    targetField.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    const initialTransition = targetField.style.transition;
    targetField.style.transition = 'box-shadow 0.2s ease-in-out';
    targetField.style.boxShadow = '0 0 10px #10B981, 0 0 0 2px #10B981';
    setTimeout(() => {
      targetField.style.boxShadow = '';
      targetField.style.transition = initialTransition;
    }, 800);

    return true;
  } catch (error) {
    console.error('CLNCH Text Injection failed:', error);
    return false;
  }
}

// ─── Page detection ────────────────────────────────────────────────────────

function isLikelyApplicationPage() {
  const hasFormFields = document.querySelector(
    'textarea, input[type="text"], input:not([type]), [contenteditable="true"]'
  );
  return Boolean(hasFormFields) || JOB_URL_PATTERN.test(window.location.href);
}

// ─── UI: Shadow DOM panel + FAB ────────────────────────────────────────────

let ui = {
  host: null,
  shadow: null,
  fab: null,
  panel: null,
  backdrop: null,
  body: null,
  fieldLabelEl: null,
  coachedContainer: null,
  statusEl: null,
  refiningEl: null,
};

function ensureUI() {
  if (ui.host) return;

  ui.host = document.createElement('div');
  ui.host.id = CLNCH_HOST_ID;
  ui.shadow = ui.host.attachShadow({ mode: 'closed' });

  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('panel.css');
  ui.shadow.appendChild(styleLink);

  ui.backdrop = document.createElement('div');
  ui.backdrop.className = 'clnch-panel-backdrop';
  ui.backdrop.addEventListener('click', closePanel);

  ui.fab = document.createElement('button');
  ui.fab.className = 'clnch-fab hidden';
  ui.fab.textContent = 'CL';
  ui.fab.title = 'Open CLNCH coaching panel';
  ui.fab.addEventListener('click', togglePanel);

  ui.panel = document.createElement('div');
  ui.panel.className = 'clnch-panel-root';
  ui.panel.innerHTML = `
    <div class="clnch-panel-header">
      <div class="clnch-panel-brand"><span class="clnch-panel-brand-dot"></span>CLNCH</div>
      <button class="clnch-panel-close" aria-label="Close panel">&times;</button>
    </div>
    <div class="clnch-panel-body">
      <div class="clnch-status info" data-status>Loading opportunity...</div>
      <div data-opp-card></div>
      <div class="clnch-field-label" data-field-label style="display:none">
        Active field: <strong data-field-name>—</strong>
      </div>
      <div class="clnch-refining" data-refining style="display:none">
        <div class="clnch-dots"><span></span><span></span><span></span></div>
        Refining your draft...
      </div>
      <p class="clnch-section-title">Coached suggestions</p>
      <div data-coached></div>
    </div>
  `;

  ui.panel.querySelector('.clnch-panel-close').addEventListener('click', closePanel);
  ui.statusEl = ui.panel.querySelector('[data-status]');
  ui.body = ui.panel.querySelector('.clnch-panel-body');
  ui.fieldLabelEl = ui.panel.querySelector('[data-field-label]');
  ui.coachedContainer = ui.panel.querySelector('[data-coached]');
  ui.refiningEl = ui.panel.querySelector('[data-refining]');

  ui.shadow.appendChild(ui.backdrop);
  ui.shadow.appendChild(ui.fab);
  ui.shadow.appendChild(ui.panel);
  document.documentElement.appendChild(ui.host);
}

function showFab(pulse = false) {
  ensureUI();
  ui.fab.classList.remove('hidden');
  if (pulse) {
    ui.fab.classList.add('pulse');
    setTimeout(() => ui.fab.classList.remove('pulse'), 6000);
  }
}

function togglePanel() {
  panelOpen ? closePanel() : openPanel();
}

function openPanel() {
  ensureUI();
  panelOpen = true;
  ui.panel.classList.add('open');
  ui.backdrop.classList.add('open');
  ui.fab.classList.add('active');
  refreshOpportunity();
}

function closePanel() {
  if (!ui.panel) return;
  panelOpen = false;
  ui.panel.classList.remove('open');
  ui.backdrop.classList.remove('open');
  ui.fab.classList.remove('active');
}

function updateFieldLabelUI(label) {
  if (!ui.fieldLabelEl) return;
  const nameEl = ui.fieldLabelEl.querySelector('[data-field-name]');
  if (nameEl) nameEl.textContent = label;
  ui.fieldLabelEl.style.display = label ? 'block' : 'none';
}

function setStatus(message, type = 'info') {
  if (!ui.statusEl) return;
  ui.statusEl.textContent = message;
  ui.statusEl.className = `clnch-status ${type}`;
  ui.statusEl.style.display = message ? 'block' : 'none';
}

function renderOpportunityCard(opp) {
  const cardHost = ui.panel?.querySelector('[data-opp-card]');
  if (!cardHost) return;

  if (!opp) {
    cardHost.innerHTML = '';
    return;
  }

  const reqs = (opp.requirements || [])
    .slice(0, 6)
    .map((r) => `<li>${escapeHtml(r)}</li>`)
    .join('');

  cardHost.innerHTML = `
    <div class="clnch-opp-card">
      <p class="clnch-opp-title">${escapeHtml(opp.title)}</p>
      <p class="clnch-opp-org">${escapeHtml(opp.org)}</p>
      <div class="clnch-opp-meta">
        <span class="clnch-badge">${escapeHtml(opp.category || 'opportunity')}</span>
        ${opp.deadline ? `<span class="clnch-badge">Due ${escapeHtml(opp.deadline)}</span>` : ''}
      </div>
      ${reqs ? `<ul class="clnch-req-list">${reqs}</ul>` : ''}
    </div>
  `;
}

function renderCoachedAnswers(answers, liveRefined) {
  if (!ui.coachedContainer) return;
  ui.coachedContainer.innerHTML = '';

  const items = [...(answers || [])];
  if (liveRefined) {
    items.unshift({ id: 'live', refinedText: liveRefined, content: liveRefined });
  }

  if (items.length === 0) {
    ui.coachedContainer.innerHTML =
      '<p style="font-size:12px;color:#888;margin:0">Focus a form field and type your raw draft — CLNCH will coach and suggest refined text here.</p>';
    return;
  }

  items.forEach((item) => {
    const text = item.refinedText || item.content || '';
    const card = document.createElement('div');
    card.className = 'clnch-coached-card';
    card.innerHTML = `
      <div class="clnch-coached-text">${escapeHtml(text)}</div>
      <button class="clnch-btn clnch-btn-primary" data-accept>Accept &amp; Fill</button>
    `;
    card.querySelector('[data-accept]').addEventListener('click', () => {
      const ok = injectRefinedTextIntoForm(text);
      const btn = card.querySelector('[data-accept]');
      if (ok) {
        btn.textContent = '✓ Filled';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = 'Accept & Fill';
          btn.disabled = false;
        }, 2500);
      }
    });
    ui.coachedContainer.appendChild(card);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function refreshOpportunity() {
  setStatus('Looking up opportunity for this page...', 'info');

  try {
    const result = await chrome.runtime.sendMessage({
      type: 'CLNCH_LOOKUP_OPPORTUNITY',
      payload: { url: window.location.href },
    });

    if (!result?.authenticated && !result?.hasConfig) {
      setStatus('Log in to the CLNCH web app once — your session will sync here automatically.', 'warn');
    } else if (!result?.opportunity) {
      setStatus('No saved CLNCH opportunity matches this page URL yet. Save it in CLNCH first.', 'warn');
      renderOpportunityCard(null);
    } else {
      setStatus('', 'info');
      opportunityData = result.opportunity;
      coachedAnswers = result.coachedAnswers || [];
      renderOpportunityCard(opportunityData);
      renderCoachedAnswers(coachedAnswers, latestRefinedAnswer);
    }
  } catch (err) {
    setStatus(`Could not load opportunity: ${err.message}`, 'warn');
  }
}

// ─── Web app bridge (postMessage) ──────────────────────────────────────────

function initializeWebAppBridge() {
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data?.type) return;

    switch (event.data.type) {
      case 'CLNCH_AUTH_SYNC':
        chrome.runtime.sendMessage({
          type: 'CLNCH_STORE_AUTH',
          payload: event.data.payload,
        });
        break;

      case 'CLNCH_INJECT_TEXT':
        injectRefinedTextIntoForm(event.data.payload?.refinedText || '');
        break;

      case 'CLNCH_ACTIVATE_ON_TAB': {
        const targetUrl = event.data.payload?.url;
        if (!targetUrl || urlsRoughlyMatch(window.location.href, targetUrl)) {
          showFab(true);
          openPanel();
        }
        break;
      }

      default:
        break;
    }
  });
}

function urlsRoughlyMatch(a, b) {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.hostname === ub.hostname;
  } catch {
    return a.includes(b) || b.includes(a);
  }
}

// ─── Runtime messages from background ──────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'CLNCH_INJECT_TEXT': {
      const success = injectRefinedTextIntoForm(message.payload?.refinedText || '');
      sendResponse({ success });
      break;
    }

    case 'CLNCH_REFINEMENT_STARTED':
      isRefining = true;
      if (ui.refiningEl) ui.refiningEl.style.display = 'flex';
      break;

    case 'CLNCH_REFINEMENT_COMPLETE':
      isRefining = false;
      latestRefinedAnswer = message.payload?.refinedAnswer || null;
      if (ui.refiningEl) ui.refiningEl.style.display = 'none';
      renderCoachedAnswers(coachedAnswers, latestRefinedAnswer);
      if (panelOpen) refreshCoachedOnly();
      break;

    case 'CLNCH_REFINEMENT_ERROR':
      isRefining = false;
      if (ui.refiningEl) ui.refiningEl.style.display = 'none';
      break;

    case 'CLNCH_FIELD_ACTIVATED':
      activeFieldLabel = message.payload?.fieldLabel || activeFieldLabel;
      updateFieldLabelUI(activeFieldLabel);
      break;

    case 'CLNCH_TOGGLE_PANEL':
      ensureUI();
      showFab(false);
      togglePanel();
      break;

    default:
      break;
  }
  return true;
});

async function refreshCoachedOnly() {
  if (!opportunityData?.sessionId) return;
  try {
    const result = await chrome.runtime.sendMessage({
      type: 'CLNCH_GET_COACHED_ANSWERS',
      payload: { fieldLabel: activeFieldLabel },
    });
    coachedAnswers = result?.answers || [];
    renderCoachedAnswers(coachedAnswers, latestRefinedAnswer);
  } catch {
    renderCoachedAnswers(coachedAnswers, latestRefinedAnswer);
  }
}

// ─── Init ──────────────────────────────────────────────────────────────────

function initialize() {
  if (window.location.protocol === 'chrome-extension:') return;

  initializeFormObserver();
  initializeWebAppBridge();

  if (isLikelyApplicationPage()) {
    showFab(false);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panelOpen) closePanel();
  });
}

initialize();
