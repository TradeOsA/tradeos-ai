import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Move,
  Maximize2
} from 'lucide-react';
import { CommunityPost } from '../../types';

interface ChartLightboxModalProps {
  post: CommunityPost | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChartLightboxModal: React.FC<ChartLightboxModalProps> = ({ post, isOpen, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-' || e.key === '_') handleZoomOut();
      if (e.key === '0') handleResetZoom();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setCopied(false);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !post || !post.chartUrl) return null;

  const isLong = post.direction === 'LONG';

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () =>
    setZoom((prev) => {
      const next = Math.max(prev - 0.25, 0.5);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev + 0.15, 4));
    } else {
      setZoom((prev) => {
        const next = Math.max(prev - 0.15, 0.5);
        if (next <= 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Pan / Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1 || e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Copy Image Link or Chart Data
  const handleCopyLink = async () => {
    if (!post.chartUrl) return;
    try {
      if (post.chartUrl.startsWith('data:image')) {
        // Copy image to clipboard if supported
        const res = await fetch(post.chartUrl);
        const blob = await res.blob();
        if (navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ [blob.type]: blob })
          ]);
        }
      } else {
        await navigator.clipboard.writeText(post.chartUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(post.chartUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  // Download Chart Screenshot
  const handleDownload = async () => {
    if (!post.chartUrl) return;
    setDownloading(true);
    try {
      const cleanSymbol = post.symbol.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${cleanSymbol}_${post.timeframe || 'chart'}_setup.png`;

      const response = await fetch(post.chartUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      // Direct anchor click fallback
      const a = document.createElement('a');
      a.href = post.chartUrl;
      a.download = `${post.symbol}_chart.png`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      id="chart-lightbox-modal"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Bar with Trading Metadata & Interactive Controls */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-[#0B0F19]/95 shrink-0 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 text-xs font-black uppercase px-2.5 py-1 rounded-lg ${
                isLong
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isLong ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{post.direction}</span>
            </span>
            <span className="text-sm font-mono font-black text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
              {post.symbol}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 truncate">
            <span className="text-slate-600">•</span>
            <span className="font-semibold text-slate-200 truncate max-w-sm">{post.title}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-emerald-400 font-bold">
              R:R {typeof post.riskRewardRatio === 'number' ? `1:${post.riskRewardRatio}` : post.riskRewardRatio || '1:2.5'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono">{post.timeframe}</span>
          </div>
        </div>

        {/* Right Action Controls: Zoom, Pan note, Copy, Download, Close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-300 px-2 min-w-[48px] text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Reset Zoom & Pan (0)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy Chart Link / Image */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title="Copy chart image link or data"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Copy</span>
              </>
            )}
          </button>

          {/* Direct Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Download full resolution chart screenshot"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline">Download</span>
          </button>

          {/* Direct External Link */}
          <a
            href={post.chartUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors hidden sm:flex items-center justify-center cursor-pointer"
            title="Open original chart image in new browser tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-300 transition-colors flex items-center justify-center cursor-pointer ml-1"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Stage with Pan & Zoom */}
      <div
        className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden select-none relative cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Floating Pan Hint when Zoomed */}
        {zoom > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 text-[11px] text-slate-300 backdrop-blur-md pointer-events-none">
            <Move className="w-3 h-3 text-indigo-400" />
            <span>Click & drag to pan chart area</span>
          </div>
        )}

        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={post.chartUrl}
            alt={`${post.symbol} trade analysis chart`}
            className="max-h-[80vh] max-w-[90vw] w-auto h-auto object-contain rounded-2xl shadow-2xl ring-1 ring-white/15 pointer-events-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Trader Info Footer */}
      <div
        className="px-4 sm:px-6 py-3 border-t border-white/10 bg-[#0B0F19]/95 shrink-0 z-20 flex items-center justify-between gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={post.authorAvatar}
            alt={post.authorName}
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/15 shrink-0"
          />
          <div className="text-xs min-w-0">
            <span className="font-bold text-white block truncate">{post.authorName}</span>
            <span className="text-slate-400 text-[11px] truncate block">{post.authorBadge}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-hidden">
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
