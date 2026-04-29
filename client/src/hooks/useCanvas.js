// useCanvas.js - Custom hook for the HTML5 Canvas drawing logic
// Handles: mouse events, drawing strokes, colors, brush size, undo, eraser

import { useRef, useEffect, useCallback, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export function useCanvas({ roomId, isDrawer, drawingData }) {
  const canvasRef = useRef(null);
  const socket = useSocket();

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser' | 'fill'

  const lastPos = useRef(null);

  // ─── Get canvas coordinates from mouse/touch event ──────────────────
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // Support both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  // ─── Draw a line segment on the canvas ──────────────────────────────
  const drawLine = useCallback((ctx, from, to, strokeColor, size, strokeTool) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = strokeTool === 'eraser' ? '#FFFFFF' : strokeColor;
    ctx.lineWidth = strokeTool === 'eraser' ? size * 3 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, []);

  // ─── Replay all stored drawing data (for undo/late joiners) ─────────
  const replayDrawingData = useCallback((data) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let currentStroke = null;
    data.forEach(d => {
      if (d.type === 'start') {
        currentStroke = { ...d, lastPos: { x: d.x, y: d.y } };
        drawLine(ctx, { x: d.x, y: d.y }, { x: d.x, y: d.y }, d.color, d.size, d.tool);
      } else if (d.type === 'move' && currentStroke) {
        drawLine(ctx, currentStroke.lastPos, { x: d.x, y: d.y }, currentStroke.color, currentStroke.size, currentStroke.tool);
        currentStroke.lastPos = { x: d.x, y: d.y };
      }
    });
  }, [drawLine]);

  // ─── Replay when drawingData changes (undo / late join) ─────────────
  useEffect(() => {
    if (drawingData && drawingData.length >= 0) {
      replayDrawingData(drawingData);
    }
  }, [drawingData, replayDrawingData]);

  // ─── Initialize canvas with white background ─────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // ─── Listen for remote draw events (from other players) ─────────────
  useEffect(() => {
    if (!socket) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let remoteStroke = null;

    const handleDrawData = (data) => {
      if (data.type === 'start') {
        remoteStroke = { ...data, lastPos: { x: data.x, y: data.y } };
        drawLine(ctx, { x: data.x, y: data.y }, { x: data.x, y: data.y }, data.color, data.size, data.tool);
      } else if (data.type === 'move' && remoteStroke) {
        drawLine(ctx, remoteStroke.lastPos, { x: data.x, y: data.y }, remoteStroke.color, remoteStroke.size, remoteStroke.tool);
        remoteStroke.lastPos = { x: data.x, y: data.y };
      } else if (data.type === 'end') {
        remoteStroke = null;
      }
    };

    const handleClear = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    socket.on('draw_data', handleDrawData);
    socket.on('canvas_cleared', handleClear);

    return () => {
      socket.off('draw_data', handleDrawData);
      socket.off('canvas_cleared', handleClear);
    };
  }, [socket, drawLine]);

  // ─── Mouse/Touch Down: start drawing ────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    if (!isDrawer) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    setIsDrawing(true);
    lastPos.current = pos;

    // Draw a dot at click position
    drawLine(ctx, pos, pos, color, brushSize, tool);

    socket.emit('draw_start', { roomId, x: pos.x, y: pos.y, color, size: brushSize, tool });
  }, [isDrawer, color, brushSize, tool, roomId, socket, drawLine]);

  // ─── Mouse/Touch Move: continue stroke ──────────────────────────────
  const handlePointerMove = useCallback((e) => {
    if (!isDrawer || !isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    if (lastPos.current) {
      drawLine(ctx, lastPos.current, pos, color, brushSize, tool);
    }
    lastPos.current = pos;

    socket.emit('draw_move', { roomId, x: pos.x, y: pos.y });
  }, [isDrawer, isDrawing, color, brushSize, tool, roomId, socket, drawLine]);

  // ─── Mouse/Touch Up: end stroke ─────────────────────────────────────
  const handlePointerUp = useCallback((e) => {
    if (!isDrawer || !isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    socket.emit('draw_end', { roomId });
  }, [isDrawer, isDrawing, roomId, socket]);

  return {
    canvasRef,
    color, setColor,
    brushSize, setBrushSize,
    tool, setTool,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
}
