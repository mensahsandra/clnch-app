import { useRef, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';

const MIN_WIDTH = 180;
const SNAP_OPEN_WIDTH = 360;

interface DraggableSplitterProps {
  rightPanelWidth: number;
  onWidthChange: (w: number) => void;
  hasSelection?: boolean;
}

export default function DraggableSplitter({ rightPanelWidth, onWidthChange, hasSelection }: DraggableSplitterProps) {
  const dragging = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;

      const handleMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const newWidth = window.innerWidth - ev.clientX;
        if (newWidth < MIN_WIDTH) {
          onWidthChange(0);
        } else {
          onWidthChange(Math.min(newWidth, 700));
        }
      };

      const handleUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [onWidthChange]
  );

  // Collapsed re-open badge — only when an opp is selected
  if (rightPanelWidth === 0 && hasSelection) {
    return (
      <div
        style={{ position: 'fixed', right: 0, top: 0, height: '100vh', width: 28, zIndex: 70 }}
        className="flex items-center justify-center bg-card-white border-l border-card-border cursor-pointer hover:bg-cream-fill/80 transition-colors group"
        onClick={() => onWidthChange(SNAP_OPEN_WIDTH)}
        onMouseEnter={() => onWidthChange(SNAP_OPEN_WIDTH)}
        title="Open panel"
      >
        <ChevronLeft className="w-4 h-4 text-slate group-hover:text-burnt-orange transition-colors" />
      </div>
    );
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        width: 4,
        cursor: 'col-resize',
        flexShrink: 0,
        position: 'relative',
        zIndex: 55,
      }}
      className="bg-card-border hover:bg-burnt-orange/30 transition-colors group"
      title="Drag to resize"
    />
  );
}
