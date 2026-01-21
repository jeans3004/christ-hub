/**
 * Contexto para gerenciar drag-and-drop via touch em dispositivos moveis.
 */

'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

interface DragState {
  isDragging: boolean;
  alunoId: string | null;
  alunoNome: string | null;
  alunoIniciais: string | null;
  position: { x: number; y: number };
}

interface TouchDragContextValue {
  dragState: DragState;
  startDrag: (alunoId: string, alunoNome: string, alunoIniciais: string, x: number, y: number) => void;
  updatePosition: (x: number, y: number) => void;
  endDrag: () => { alunoId: string | null; targetElement: Element | null };
  cancelDrag: () => void;
}

const initialDragState: DragState = {
  isDragging: false,
  alunoId: null,
  alunoNome: null,
  alunoIniciais: null,
  position: { x: 0, y: 0 },
};

const TouchDragContext = createContext<TouchDragContextValue | null>(null);

export function TouchDragProvider({ children }: { children: ReactNode }) {
  const [dragState, setDragState] = useState<DragState>(initialDragState);
  const lastPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const startDrag = useCallback((alunoId: string, alunoNome: string, alunoIniciais: string, x: number, y: number) => {
    lastPosition.current = { x, y };
    setDragState({
      isDragging: true,
      alunoId,
      alunoNome,
      alunoIniciais,
      position: { x, y },
    });
  }, []);

  const updatePosition = useCallback((x: number, y: number) => {
    lastPosition.current = { x, y };
    setDragState((prev) => ({
      ...prev,
      position: { x, y },
    }));
  }, []);

  const endDrag = useCallback(() => {
    const { x, y } = lastPosition.current;
    const alunoId = dragState.alunoId;

    // Find the element under the touch point
    // Temporarily hide the drag preview to get the element underneath
    const preview = document.getElementById('touch-drag-preview');
    if (preview) {
      preview.style.display = 'none';
    }

    const targetElement = document.elementFromPoint(x, y);

    if (preview) {
      preview.style.display = '';
    }

    // Find the closest seat cell
    const seatCell = targetElement?.closest('[data-seat-cell]') ?? null;

    setDragState(initialDragState);

    return { alunoId, targetElement: seatCell };
  }, [dragState.alunoId]);

  const cancelDrag = useCallback(() => {
    setDragState(initialDragState);
  }, []);

  return (
    <TouchDragContext.Provider value={{ dragState, startDrag, updatePosition, endDrag, cancelDrag }}>
      {children}
      {/* Drag Preview */}
      {dragState.isDragging && (
        <div
          id="touch-drag-preview"
          style={{
            position: 'fixed',
            left: dragState.position.x - 30,
            top: dragState.position.y - 30,
            width: 60,
            height: 60,
            backgroundColor: '#1976d2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            zIndex: 9999,
            transform: 'scale(1.1)',
            transition: 'transform 0.1s',
          }}
        >
          {dragState.alunoIniciais}
        </div>
      )}
    </TouchDragContext.Provider>
  );
}

export function useTouchDrag() {
  const context = useContext(TouchDragContext);
  if (!context) {
    throw new Error('useTouchDrag must be used within TouchDragProvider');
  }
  return context;
}
