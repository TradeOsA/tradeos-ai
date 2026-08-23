import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  X,
  ArrowLeft,
  ChevronLeft,
  Send,
  ShieldCheck,
  Zap,
  Brain,
  Activity,
  Maximize2,
  RefreshCw,
  HelpCircle,
  ThumbsUp,
  RotateCcw
} from 'lucide-react';
import { ChatMessage, MarketAsset, UserProfile } from '../../types';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAsset: MarketAsset | null;
  userProfile: UserProfile;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  selectedAsset,
  userProfile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      role: 'assistant',
      content: `Hello ${userProfile.name}. I am your institutional AI Trading Copilot & Capital Guardian.\n\nAsk me about technical invalidation levels for ${selectedAsset?.symbol || 'BTC/USDT'}, risk allocation mathematics, or request an emotional reset if you are feeling FOMO or tilt.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePersona, setActivePersona] = useState<'guardian' | 'smc' | 'psychology'>('guardian');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  // Handle ESC key to exit/close copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const quickPrompts = [
    `Analyze ${selectedAsset?.symbol || 'BTC'} market structure`,
    'Calculate maximum 1% risk for $25k account',
    'I just took 2 consecutive losses. Help me reset.',
    'What is the liquidity sweep checklist?',
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputPrompt('');
    setIsLoading(true);

    try {
      // Call server Gemini endpoint
      const res = await fetch('/api/ai/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role === 'assistant' ? 'model' : m.role,
            content: m.content,
          })),
          persona: activePersona,
          userProfile,
          currentAsset: selectedAsset?.symbol,
        }),
      });

      if (!res.ok) throw new Error('AI request failed');
      const data = await res.json();

      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || "Analysis complete. Always preserve capital and maintain hard stop losses.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      // Fallback
      setTimeout(() => {
        const fallbackMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: `**Institutional Analysis for ${selectedAsset?.symbol || 'Current Market'}:**\n\n1. **Trend & Liquidity**: Price is currently testing key dynamic support. Avoid market entries in the middle of the range.\n2. **Capital Protection**: Limit maximum risk exposure to **${userProfile.defaultRiskPercent || 1}%** per position.\n3. **Psychological Rule**: No trade is better than a forced trade. Wait for clean invalidation.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-auto">
        <div className="w-screen max-w-md sm:max-w-lg bg-[#0B0F18] border-l border-white/10 shadow-2xl glass-panel flex flex-col">
          {/* Header with Back button and Cut/Close button */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#0E1321]/90 gap-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Back to Terminal / Close Copilot"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Back</span>
              </button>

              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 via-indigo-500/20 to-purple-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-xs sm:text-sm tracking-tight truncate max-w-[140px] sm:max-w-[200px]">
                    TradeosAi Copilot
                  </h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full hidden sm:inline-block">
                    Active
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Real-time risk & market guardian</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onClose}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 hover:border-red-500/30 border border-white/10 text-xs font-bold transition-all cursor-pointer"
                title="Cut / Close Copilot (Esc)"
              >
                <span className="text-[11px] hidden sm:inline">Close</span>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Persona Switcher Chips */}
          <div className="px-4 py-2 bg-[#080B12] border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => setActivePersona('guardian')}
              className={`px-3 py-1 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activePersona === 'guardian'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Capital Guardian</span>
            </button>
            <button
              onClick={() => setActivePersona('smc')}
              className={`px-3 py-1 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activePersona === 'smc'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>SMC / Liquidity</span>
            </button>
            <button
              onClick={() => setActivePersona('psychology')}
              className={`px-3 py-1 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activePersona === 'psychology'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Psychologist</span>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    isAssistant ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-line ${
                      isAssistant
                        ? 'bg-[#101624] border border-white/[0.08] text-slate-200 rounded-tl-sm'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-sm font-medium'
                    }`}
                  >
                    {m.content}
                    <div
                      className={`text-[9px] mt-1.5 font-mono ${
                        isAssistant ? 'text-slate-500' : 'text-emerald-100/70'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-spin">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#101624] border border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[11px] text-slate-400 ml-1">Analyzing market risk...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-4 py-2 border-t border-white/[0.06] bg-[#0A0D15] overflow-x-auto scrollbar-none flex items-center gap-2">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 text-[10px] text-slate-400 hover:text-emerald-300 font-medium whitespace-nowrap transition-all cursor-pointer shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-white/[0.08] bg-[#0E1321]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about invalidation, risk, setups, psychology..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                className="flex-1 bg-[#141A29] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isLoading}
                className="p-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold transition-all cursor-pointer shrink-0 shadow-lg shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
