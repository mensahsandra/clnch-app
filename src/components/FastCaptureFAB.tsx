import { useState } from 'react';
import { Plus } from 'lucide-react';
import FastCaptureModal, { type CaptureData } from './FastCaptureModal';
import { useFastCapture } from '../context/FastCaptureContext';
import { useWorkspace } from '../context/WorkspaceContext';

export default function FastCaptureFAB() {
  const [modalOpen, setModalOpen] = useState(false);
  const { captureUrl } = useFastCapture();
  const { rightPanelWidth } = useWorkspace();

  const handleSubmit = async (data: CaptureData) => {
    await captureUrl(data.link, {
      description: data.description,
      categoryHints: data.categoryHints,
      screenshots: data.screenshots,
    });
  };

  const rightOffset = rightPanelWidth > 0 ? rightPanelWidth + 24 : 24;

  return (
    <>
      <button
        data-tour="fast-capture"
        onClick={() => setModalOpen(true)}
        aria-label="Fast-Capture New Opportunity"
        className="fixed bottom-6 z-[100] w-14 h-14 rounded-full bg-burnt-orange hover:bg-burnt-orange/90 active:scale-95 flex items-center justify-center group"
        style={{
          right: rightOffset,
          transition: 'right 0.2s ease-out, box-shadow 0.15s ease, transform 0.1s ease',
          boxShadow: '0 4px 24px rgba(207, 95, 50, 0.45)',
        }}
      >
        <Plus
          className="w-6 h-6 text-white transition-transform duration-200 group-hover:rotate-90"
          strokeWidth={2.5}
        />
      </button>

      <FastCaptureModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
