import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Lock,
  PlayCircle,
  HelpCircle,
  Award,
  ChevronRight,
  Clock,
  ArrowLeft,
  Sparkles,
  Zap
} from 'lucide-react';
import { defaultAcademyLessons } from '../../data/mockData';
import { AcademyLesson, LessonQuiz } from '../../types';
import { PageHeader } from '../layout/PageHeader';

interface AcademyViewProps {
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AcademyView: React.FC<AcademyViewProps> = ({ onBack, onNavigateTab }) => {
  const [lessons, setLessons] = useState<AcademyLesson[]>(defaultAcademyLessons);
  const [selectedLesson, setSelectedLesson] = useState<AcademyLesson | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Active Quiz State
  const [activeQuizQuestionIdx, setActiveQuizQuestionIdx] = useState<number>(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const categories = [
    'All',
    'Price Action',
    'Risk Management',
    'Market Structure',
    'Psychology',
    'Indicators & Math',
  ];

  const filteredLessons = lessons.filter(
    (l) => filterCategory === 'All' || l.category === filterCategory
  );

  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const overallProgress = Math.round((completedCount / lessons.length) * 100);

  const handleStartLesson = (lesson: AcademyLesson) => {
    setSelectedLesson(lesson);
    setActiveQuizQuestionIdx(0);
    setSelectedAnswerIdx(null);
    setShowExplanation(false);
    setQuizScore(0);
    setQuizFinished(false);
  };

  const handleAnswerSubmit = (optionIdx: number, correctIdx: number) => {
    if (showExplanation) return;
    setSelectedAnswerIdx(optionIdx);
    setShowExplanation(true);
    if (optionIdx === correctIdx) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = (totalQuestions: number) => {
    if (activeQuizQuestionIdx < totalQuestions - 1) {
      setActiveQuizQuestionIdx((prev) => prev + 1);
      setSelectedAnswerIdx(null);
      setShowExplanation(false);
    } else {
      setQuizFinished(true);
      // Mark lesson completed
      if (selectedLesson) {
        setLessons((prev) =>
          prev.map((l) => (l.id === selectedLesson.id ? { ...l, isCompleted: true } : l))
        );
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Universal Page Header with Breadcrumbs */}
      <PageHeader
        title="Institutional Learning Academy"
        subtitle="Master Smart Money Concepts (SMC), liquidity sweeps, mathematical risk management, and neurological trading psychology with interactive quizzes."
        badge={`${completedCount}/${lessons.length} Modules Completed`}
        badgeVariant="emerald"
        icon={GraduationCap}
        breadcrumbs={[
          { label: 'Academy', tab: 'academy' },
          ...(selectedLesson ? [{ label: selectedLesson.title }] : []),
        ]}
        onBack={selectedLesson ? () => setSelectedLesson(null) : onBack}
        onNavigateTab={onNavigateTab}
        actionSlot={
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#121827] border border-[#1C263C] text-xs">
            <Award className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-white font-bold">{overallProgress}% Curriculum Score</div>
              <div className="w-24 bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>
          </div>
        }
      />

      {/* If Viewing a Lesson */}
      {selectedLesson ? (
        <div className="rounded-xl p-5 sm:p-6 bg-[#0E131F] border border-[#1C263C] space-y-5">
          <button
            onClick={() => setSelectedLesson(null)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Academy Curriculum</span>
          </button>

          <div className="border-b border-[#1C263C] pb-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {selectedLesson.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {selectedLesson.readTime}
              </span>
              <span className="text-xs text-indigo-400 font-semibold">
                • {selectedLesson.level} Level
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{selectedLesson.title}</h2>
            <p className="text-xs text-slate-400">{selectedLesson.overview}</p>
          </div>

          {/* Key Points */}
          {selectedLesson.keyPoints && (
            <div className="p-3.5 rounded-lg bg-[#121827] border border-[#1C263C] space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase">Core Takeaways:</span>
              <ul className="space-y-1 text-xs text-slate-300">
                {selectedLesson.keyPoints.map((kp, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{kp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lesson Rich Content */}
          <div className="p-5 rounded-lg bg-[#121827] border border-[#1C263C] space-y-4 text-xs text-slate-300 leading-relaxed font-normal whitespace-pre-line">
            {selectedLesson.contentMarkdown}
          </div>

          {/* Quiz Section */}
          {selectedLesson.quiz && selectedLesson.quiz.length > 0 && (
            <div className="p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-base text-white">Interactive Knowledge Check</h3>
                </div>
                <span className="text-xs text-indigo-300 font-mono">
                  Question {activeQuizQuestionIdx + 1} of {selectedLesson.quiz.length}
                </span>
              </div>

              {!quizFinished ? (
                (() => {
                  const q = selectedLesson.quiz[activeQuizQuestionIdx];
                  return (
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white">{q.question}</h4>

                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          let btnStyle = 'bg-[#121827] hover:bg-[#182236] border-[#1C263C] text-slate-200';
                          if (showExplanation) {
                            if (optIdx === q.correctIndex) {
                              btnStyle = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold';
                            } else if (selectedAnswerIdx === optIdx) {
                              btnStyle = 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold';
                            } else {
                              btnStyle = 'bg-[#121827] opacity-50 border-[#1C263C] text-slate-400';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleAnswerSubmit(optIdx, q.correctIndex)}
                              className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer ${btnStyle}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{opt}</span>
                                {showExplanation && optIdx === q.correctIndex && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {showExplanation && (
                        <div className="p-3.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300 space-y-2">
                          <span className="font-bold text-indigo-300 block">Explanation:</span>
                          <p>{q.explanation}</p>
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => handleNextQuestion(selectedLesson.quiz!.length)}
                              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                            >
                              {activeQuizQuestionIdx < selectedLesson.quiz!.length - 1
                                ? 'Next Question'
                                : 'Complete Lesson & Grade Quiz'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-5 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                    <Award className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Lesson Completed!</h4>
                  <p className="text-xs text-slate-300">
                    You scored <strong className="text-emerald-400">{quizScore} / {selectedLesson.quiz.length}</strong> on the comprehension quiz.
                  </p>
                  <button
                    onClick={() => setSelectedLesson(null)}
                    className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Return to Academy
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Lessons Directory Grid */
        <div className="space-y-4">
          {/* Filter Module Tabs */}
          <div className="flex items-center gap-1 bg-[#121827] p-1 rounded-lg border border-[#1C263C] overflow-x-auto scrollbar-none text-xs">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilterCategory(c)}
                className={`px-3 py-1 rounded-md font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterCategory === c
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => handleStartLesson(lesson)}
                className="rounded-xl p-5 bg-[#0E131F] border border-[#1C263C] hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between space-y-3.5"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {lesson.category}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {lesson.readTime}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-emerald-300 transition-colors">
                    {lesson.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {lesson.overview}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-[#1C263C] pt-3">
                  {lesson.isCompleted ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">{lesson.level}</span>
                  )}

                  <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-emerald-400 font-bold transition-colors">
                    <span>Study Module</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
