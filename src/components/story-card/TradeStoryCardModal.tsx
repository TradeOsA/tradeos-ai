import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  Check,
  Smartphone,
  Sparkles,
  Trophy,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Copy,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Trade, UserProfile } from '../../types';
import { APP_CONFIG } from '../../config/branding';
import { getPublicAppUrl } from '../../utils/appUrl';

interface TradeStoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade?: Trade | null;
  user: UserProfile;
  disciplineScore?: number;
}

type CardFormat = 'STORY_9_16' | 'LANDSCAPE_16_9';

export const TradeStoryCardModal: React.FC<TradeStoryCardModalProps> = ({
  isOpen,
  onClose,
  trade,
  user,
  disciplineScore = 92,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [format, setFormat] = useState<CardFormat>('STORY_9_16');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fallback default trade if none selected
  const activeTrade: Trade = trade || {
    id: 'demo-share',
    symbol: 'BTC/USDT',
    market: 'Crypto',
    direction: 'LONG',
    entryPrice: 66800,
    exitPrice: 71200,
    stopLoss: 65400,
    targetPrice: 71200,
    quantity: 0.5,
    positionSizeUsd: 33400,
    leverage: 10,
    pnl: 2200,
    pnlPercent: 65.8,
    riskRewardRatio: 3.14,
    status: 'WIN',
    strategy: 'Breakout / Expansion',
    notes: 'Clean 4h range breakout with volume surge.',
    emotionBefore: 'Disciplined',
    emotionAfter: 'Satisfied',
    openDate: '2026-08-18',
    fees: 15,
    tags: ['Breakout', 'SmartMoney'],
  };

  useEffect(() => {
    if (isOpen) {
      renderCardCanvas();
    }
  }, [isOpen, format, activeTrade]);

  const renderCardCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = format === 'STORY_9_16' ? 1080 : 1200;
    const height = format === 'STORY_9_16' ? 1920 : 675;

    canvas.width = width;
    canvas.height = height;

    // 1. Background Gradient (Cyber Obsidian)
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#06090F');
    bgGradient.addColorStop(0.5, '#0B101E');
    bgGradient.addColorStop(1, '#05070D');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Radial Glow
    const isWin = (activeTrade.pnl || 0) >= 0;
    const glowColor = isWin ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    const radial = ctx.createRadialGradient(width / 2, height / 3, 50, width / 2, height / 3, width / 1.5);
    radial.addColorStop(0, glowColor);
    radial.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    // 3. Grid Pattern Overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (format === 'STORY_9_16') {
      // ===== STORY 9:16 LAYOUT =====

      // Header Brand
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('⚡ TRADEOS TERMINAL', 80, 140);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '24px sans-serif';
      ctx.fillText('Capital Suraksha Club • Institutional Risk Shield', 80, 180);

      // Main Glass Card Box
      const cardX = 60;
      const cardY = 240;
      const cardW = width - 120;
      const cardH = 1420;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      roundRect(ctx, cardX, cardY, cardW, cardH, 40);
      ctx.fill();
      ctx.stroke();

      // Trader Pill
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(`Trader: ${user.name || 'Alpha Trader'}`, cardX + 50, cardY + 90);

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`🛡️ Discipline Rating: ${disciplineScore}%`, cardX + 50, cardY + 130);

      // Symbol & Direction Badge
      const isLong = activeTrade.direction === 'LONG';
      ctx.fillStyle = isLong ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      ctx.strokeStyle = isLong ? '#10B981' : '#EF4444';
      ctx.lineWidth = 2;
      roundRect(ctx, cardX + 50, cardY + 180, 220, 60, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isLong ? '#10B981' : '#EF4444';
      ctx.font = 'black 28px sans-serif';
      ctx.fillText(`${activeTrade.direction} ${activeTrade.leverage || 1}X`, cardX + 75, cardY + 222);

      // Symbol Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 72px sans-serif';
      ctx.fillText(activeTrade.symbol, cardX + 50, cardY + 340);

      ctx.fillStyle = '#64748B';
      ctx.font = '28px sans-serif';
      ctx.fillText(`Strategy: ${activeTrade.strategy}`, cardX + 50, cardY + 390);

      // HUGE PnL % Box
      const pnlBoxY = cardY + 440;
      ctx.fillStyle = isWin ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
      ctx.strokeStyle = isWin ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      roundRect(ctx, cardX + 50, pnlBoxY, cardW - 100, 320, 30);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('REALIZED RETURN ON RISK', cardX + 80, pnlBoxY + 60);

      const pnlPctStr = `${isWin ? '+' : ''}${activeTrade.pnlPercent || 0}%`;
      ctx.fillStyle = isWin ? '#34D399' : '#F87171';
      ctx.font = 'black 110px monospace';
      ctx.fillText(pnlPctStr, cardX + 80, pnlBoxY + 180);

      const pnlDollarStr = `${isWin ? '+' : ''}$${(activeTrade.pnl || 0).toLocaleString()} USD`;
      ctx.fillStyle = isWin ? '#10B981' : '#EF4444';
      ctx.font = 'bold 42px monospace';
      ctx.fillText(pnlDollarStr, cardX + 80, pnlBoxY + 260);

      // 4-Block Trade Execution Matrix
      const matrixY = cardY + 800;
      const colW = (cardW - 130) / 2;
      const rowH = 150;

      drawMatrixCell(ctx, cardX + 50, matrixY, colW, rowH, 'ENTRY PRICE', `$${activeTrade.entryPrice.toLocaleString()}`, '#FFFFFF');
      drawMatrixCell(ctx, cardX + 70 + colW, matrixY, colW, rowH, 'EXIT / TARGET', `$${(activeTrade.exitPrice || activeTrade.targetPrice).toLocaleString()}`, isWin ? '#34D399' : '#F87171');
      drawMatrixCell(ctx, cardX + 50, matrixY + 170, colW, rowH, 'STOP LOSS', `$${activeTrade.stopLoss.toLocaleString()}`, '#F87171');
      drawMatrixCell(ctx, cardX + 70 + colW, matrixY + 170, colW, rowH, 'RISK : REWARD', `1 : ${activeTrade.riskRewardRatio}`, '#FBBF24');

      // Notes Quote
      if (activeTrade.notes) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        roundRect(ctx, cardX + 50, matrixY + 360, cardW - 100, 140, 20);
        ctx.fill();

        ctx.fillStyle = '#CBD5E1';
        ctx.font = 'italic 26px sans-serif';
        ctx.fillText(`"${activeTrade.notes.slice(0, 55)}..."`, cardX + 80, matrixY + 440);
      }

      // Footer Call to Action
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('Verified on TradeosAi Terminal • Zero Risk Mistakes', width / 2 - 270, height - 120);

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('tradeos.app', width / 2 - 90, height - 70);
    } else {
      // ===== LANDSCAPE 16:9 LAYOUT =====
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(activeTrade.symbol, 60, 100);

      ctx.fillStyle = isWin ? '#34D399' : '#F87171';
      ctx.font = 'black 80px monospace';
      ctx.fillText(`${isWin ? '+' : ''}${activeTrade.pnlPercent || 0}%`, 60, 200);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '24px sans-serif';
      ctx.fillText(`Net: ${isWin ? '+' : ''}$${(activeTrade.pnl || 0).toLocaleString()} USD • R:R 1:${activeTrade.riskRewardRatio}`, 60, 260);

      // Watermark
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('⚡ TradeosAi Terminal', width - 360, 100);
    }
  };

  const drawMatrixCell = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    val: string,
    valColor: string
  ) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    roundRect(ctx, x, y, w, h, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(label, x + 24, y + 45);

    ctx.fillStyle = valColor;
    ctx.font = 'black 34px monospace';
    ctx.fillText(val, x + 24, y + 105);
  };

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    const link = document.createElement('a');
    link.download = `TradeosAi-${activeTrade.symbol.replace('/', '')}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsGenerating(false);

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}
  };

  const handleShareWhatsApp = () => {
    const appUrl = getPublicAppUrl();
    const text = `🔥 Check my latest ${activeTrade.direction} setup on ${activeTrade.symbol}! PnL: ${
      (activeTrade.pnlPercent || 0) >= 0 ? '+' : ''
    }${activeTrade.pnlPercent}% ($${activeTrade.pnl || 0})\n\nTracked with TradeosAi Terminal: ${appUrl}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[94vh] flex flex-col rounded-3xl bg-[#0B0F19] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0E1321]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Viral Trade Setup Card</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  PNG Export
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Shareable high-resolution badge for WhatsApp Status, Instagram Story & Telegram
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selectors */}
        <div className="px-6 py-3 border-b border-white/5 bg-[#090D16] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormat('STORY_9_16')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                format === 'STORY_9_16'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              📱 Story (9:16)
            </button>
            <button
              onClick={() => setFormat('LANDSCAPE_16_9')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                format === 'LANDSCAPE_16_9'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              🖥️ Banner (16:9)
            </button>
          </div>
          <span className="text-xs text-slate-400 font-mono">1080 × 1920 HD</span>
        </div>

        {/* Canvas Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-[#070A10]">
          <div className="max-w-[280px] sm:max-w-[340px] shadow-2xl rounded-2xl overflow-hidden border border-white/10">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#0E1321] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleShareWhatsApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Share on WhatsApp</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadPNG}
              disabled={isGenerating}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Saving...' : 'Download Image (PNG)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
