// Canvas.js - The drawing canvas with all tools
// Uses HTML5 Canvas API for pixel-level drawing control

import React from 'react';
import { useCanvas } from '../hooks/useCanvas';

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00AA00', '#0000FF',
  '#FFFF00', '#FF8800', '#FF00FF', '#00FFFF', '#8B4513',
  '#808080', '#C0C0C0', '#FFC0CB', '#90EE90', '#ADD8E6',
  '#FFD700', '#800080', '#006400', '#000080', '#8B0000'
];

const BRUSH_SIZES = [
  { label: 'XS', size: 3 },
  { label: 'S',  size: 6 },
  { label: 'M',  size: 12 },
  { label: 'L',  size: 20 },
  { label: 'XL', size: 32 }
];

export default function Canvas({ roomId, isDrawer, drawingData, onClear, onUndo }) {
  const {
    canvasRef,
    color, setColor,
    brushSize, setBrushSize,
    tool, setTool,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = useCanvas({ roomId, isDrawer, drawingData });

  return (
    <div className="canvas-container">
      {/* The actual drawing canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className={`drawing-canvas ${isDrawer ? 'can-draw' : 'view-only'}`}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />

      {/* Drawing toolbar - only visible to the drawer */}
      {isDrawer && (
        <div className="toolbar">
          {/* Tools */}
          <div className="tool-group">
            <button
              className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
              onClick={() => setTool('pen')}
              title="Pen"
            >
              ✏️
            </button>
            <button
              className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
              title="Eraser"
            >
              🧹
            </button>
          </div>

          {/* Brush size */}
          <div className="tool-group">
            {BRUSH_SIZES.map(({ label, size }) => (
              <button
                key={size}
                className={`size-btn ${brushSize === size ? 'active' : ''}`}
                onClick={() => setBrushSize(size)}
                title={`Brush size ${label}`}
              >
                <div
                  className="size-dot"
                  style={{ width: Math.min(size, 24), height: Math.min(size, 24) }}
                />
              </button>
            ))}
          </div>

          {/* Color palette */}
          <div className="color-palette">
            {COLORS.map(c => (
              <button
                key={c}
                className={`color-btn ${color === c ? 'selected' : ''}`}
                style={{ backgroundColor: c, border: c === '#FFFFFF' ? '1px solid #ccc' : 'none' }}
                onClick={() => { setColor(c); setTool('pen'); }}
                title={c}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="tool-group">
            <button className="tool-btn action-btn" onClick={onUndo} title="Undo">↩️</button>
            <button className="tool-btn action-btn" onClick={onClear} title="Clear">🗑️</button>
          </div>
        </div>
      )}
    </div>
  );
}
