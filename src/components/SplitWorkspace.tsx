import { useRef, useCallback, useEffect, useState } from 'react';

interface SplitWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  panelWidth: number;
  onWidthChange: (width: number) => void;
  children: React.ReactNode;
  minPanelWidth?: number;
  maxPanelWidth?: number;
}

export default function SplitWorkspace({
  isOpen,
  onClose,
  panelWidth,
  onWidthChange,
  children,
  minPanelWidth = 360,
  maxPanelWidth = 720,
}: SplitWorkspaceProps) {
  const [isDragging, setIsDragging] = useState(false);
  const splitterRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [panelWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const delta = startXRef.current - e.clientX;
    const newWidth = Math.max(minPanelWidth, Math.min(maxPanelWidth, startWidthRef.current + delta));
    onWidthChange(newWidth);
  }, [isDragging, minPanelWidth, maxPanelWidth, onWidthChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/20 z-40 lg:hidden transition-opacity"
        onClick={onClose}
      />

      {/* Panel container */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex"
        style={{
          width: panelWidth,
          transition: isDragging ? 'none' : 'width 0.2s ease-out',
        }}
      >
        {/* Main panel */}
        <div className="flex-1 bg-card-white border-l border-card-border flex flex-col shadow-xl overflow-hidden">
          {children}
        </div>

        {/* Drag splitter */}
        <div
          ref={splitterRef}
          onMouseDown={handleMouseDown}
          className={`w-1 cursor-col-resize flex-shrink-0 transition-colors ${
            isDragging ? 'bg-burnt-orange' : 'bg-card-border hover:bg-burnt-orange/50'
          }`}
        />
      </div>
    </>
  );
}
