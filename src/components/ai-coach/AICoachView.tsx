import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Trash2,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  BrainCircuit,
  Zap
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../../types';
import { PageHeader } from '../layout/PageHeader';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

interface AICoachViewProps {
  user: UserProfile;
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AICoachView: React.FC<AICoachViewProps> = ({
  user,
  onBack,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'model',
      content: `Hello ${user.name.split(' ')[0]}. I am your TradeosAi Coach.\n\nMy purpose is strictly educational: to help you master discipline, calculate statistical expectancy, avoid revenge trading, and respect risk limits.\n\nWhat challenge or strategy are you working on today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [coachPersona, setCoachPersona] = useState<'risk-officer' | 'smc-mentor' | 'psychologist'>('risk-officer');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const presetQuestions = [
    'I just took 2 losses and feel tempted to size up to recover fast.',
    'Explain how to calculate exact position size for a $50k account risking 1%.',
    'What is a Fair Value Gap (FVG) and how do institutional algorithms treat it?',
    'Review my pre-market routine for high-impact CPI releases.',
    'How do I overcome the fear of pulling the trigger after a losing streak?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setLoading(true);

    try {
      // Build conversation history for API
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let personaPrompt = '';
      if (coachPersona === 'risk-officer') {
        personaPrompt = 'Tone: Strict, objective Risk Officer focusing on capital preservation, math, and no emotional deviations.';
      } else if (coachPersona === 'smc-mentor') {
        personaPrompt = 'Tone: Smart Money Concepts (SMC) mentor focusing on liquidity pools, order blocks, structural invalidations, and high R:R execution.';
      } else {
        personaPrompt = 'Tone: Trading Psychologist focusing on emotional regulation, FOMO deterrence, tilt prevention, and journaling discipline.';
      }

      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          persona: coachPersona === 'risk-officer' ? 'guardian' : coachPersona === 'smc-mentor' ? 'smc' : 'psychology',
          userProfile: user,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get coach response');
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: `mod-${Date.now()}`,
        role: 'model',
        content: data.reply || 'Let us focus on risk management and discipline.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: 'I encountered a brief connection issue. Remember: always protect capital first.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'msg-welcome',
        role: 'model',
        content: `Chat session reset. Ready to analyze risk, psychology, or market concepts.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Universal Page Header with Breadcrumbs */}
      <PageHeader
        title="AI Trading Coach & Psychologist"
        subtitle="A dedicated execution mentor to audit your trade psychology, eliminate FOMO and revenge trading, and enforce strict capital defense."
        badge="Gemini Intelligence Online"
        badgeVariant="emerald"
        icon={Bot}
        breadcrumbs={[{ label: 'Trading Coach', tab: 'ai-coach' }]}
        onBack={onBack}
        onNavigateTab={onNavigateTab}
        actionSlot={
          <div className="flex items-center gap-1 bg-[#121827] p-1 rounded-lg border border-[#1C263C] text-xs">
            <button
              onClick={() => setCoachPersona('risk-officer')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                coachPersona === 'risk-officer'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Risk Officer
            </button>
            <button
              onClick={() => setCoachPersona('smc-mentor')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                coachPersona === 'smc-mentor'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SMC Mentor
            </button>
            <button
              onClick={() => setCoachPersona('psychologist')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                coachPersona === 'psychologist'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Psychologist
            </button>
          </div>
        }
      />

      {/* Chat Container */}
      <div className="rounded-xl border border-[#1C263C] bg-[#0E131F] flex flex-col h-[600px] overflow-hidden">
        {/* Top Chat Bar */}
        <div className="p-3.5 border-b border-[#1C263C] flex items-center justify-between bg-[#121827]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">TradeosAi Coach</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <span className="text-[10px] text-slate-400">
                Mode:{' '}
                {coachPersona === 'risk-officer'
                  ? 'Strict Capital Guardian'
                  : coachPersona === 'smc-mentor'
                  ? 'Smart Money & Liquidity Mentor'
                  : 'Trading Psychology & Tilt Management'}
              </span>
            </div>
          </div>

          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
            title="Reset Chat Session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-[#161F30] text-emerald-400 border border-[#1C263C]'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-xl p-3.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-emerald-500/15 text-slate-100 border border-emerald-500/30 font-medium'
                      : 'bg-[#121827] text-slate-200 border border-[#1C263C]'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <MarkdownRenderer content={msg.content} />
                  )}
                  <div
                    className={`text-[9px] mt-1.5 font-mono ${
                      isUser ? 'text-emerald-400/70 text-right' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-lg bg-[#161F30] text-emerald-400 border border-[#1C263C] flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3.5 rounded-xl bg-[#121827] border border-[#1C263C] text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Synthesizing guidance with disciplined risk models...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-3.5 py-2 bg-[#121827] border-t border-[#1C263C] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Quick Ask:</span>
          {presetQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-[11px] font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-[#080B11] border-t border-[#1C263C]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask your coach anything on risk, psychology, market mechanics, or emotional state..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 bg-[#121827] border border-[#1C263C] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
