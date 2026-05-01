import React, { useRef, useState, useEffect } from 'react';
import { Minus, Plus, Eraser, Send, PenTool, X } from 'lucide-react';

interface DrawingCanvasProps {
  onSend: (imageBase64: string, caption: string) => void;
  onClose: () => void;
}

export default function DrawingCanvas({ onSend, onClose }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive canvas
    const resizeCanvas = () => {
      const p = canvas.parentElement;
      if (p) {
        canvas.width = p.clientWidth;
        canvas.height = p.clientHeight - 80;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath(); // Reset path
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const [caption, setCaption] = useState('');

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSend(canvas.toDataURL('image/png'), caption);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-t-xl overflow-hidden shadow-xl border-t dark:border-gray-800">
      <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-sm">
            <PenTool size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200">Pencil AI Blackboard</h3>
            <p className="text-[10px] text-gray-400">Draw a diagram or write a problem</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded-full border-none cursor-pointer bg-transparent"
          />
          <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-full px-2 border dark:border-gray-600">
            <button onClick={() => setLineWidth(Math.max(1, lineWidth - 1))} className="p-1 hover:text-whatsapp-teal"><Minus size={14}/></button>
            <span className="text-xs font-mono w-4 text-center">{lineWidth}</span>
            <button onClick={() => setLineWidth(Math.min(20, lineWidth + 1))} className="p-1 hover:text-whatsapp-teal"><Plus size={14}/></button>
          </div>
          <button 
            onClick={clearCanvas} 
            title="Clear Blackboard"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-400 group"
          >
            <Eraser size={18} className="group-hover:rotate-12 transition-transform" />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-white dark:bg-[#1a1a1a] relative overflow-hidden">
        {/* Blackboard texture or lines if desired */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair w-full h-full relative z-10"
        />
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800 flex flex-col gap-3">
        <input 
          type="text" 
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Type your question here (optional)..."
          className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border dark:border-gray-600 outline-none focus:ring-2 focus:ring-whatsapp-green text-sm"
        />
        <div className="flex justify-center">
          <button 
            onClick={handleSend}
            className="bg-whatsapp-green hover:bg-whatsapp-green/90 text-white px-10 py-3 rounded-full flex items-center gap-2 font-bold shadow-lg shadow-whatsapp-green/20 transition-all active:scale-95"
          >
            <Send size={18} /> Solve with Zoya
          </button>
        </div>
      </div>
    </div>
  );
}
