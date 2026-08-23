import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Share2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Send,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  AlertTriangle,
  Search,
  Filter,
  Maximize2,
  Layers,
  Clock,
  Compass,
  ArrowUpDown,
  BookOpen,
  Zap,
  Tag,
  Copy,
  Check,
  Download,
  ExternalLink,
  LineChart,
  Camera,
  Target
} from 'lucide-react';
import { CommunityPost, MarketCategory, TradeDirection } from '../../types';
import { PageHeader } from '../layout/PageHeader';
import { EditPostModal } from './EditPostModal';
import { PublishThesisModal } from './PublishThesisModal';
import { ChartLightboxModal } from './ChartLightboxModal';

interface CommunityViewProps {
  onBack?: () => void;
  onNavigateTab?: (tab: string) => void;
}

const CURRENT_USER_NAME = 'Alex Vance (You)';
const CURRENT_USER_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

const STORAGE_KEY = 'tradeos_community_posts_clean_v1';

const MARKET_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All Markets', value: 'ALL' },
  { label: 'Crypto', value: 'Crypto' },
  { label: 'Stocks', value: 'Stocks' },
  { label: 'Forex', value: 'Forex' },
  { label: 'Futures', value: 'Futures' },
  { label: 'Commodities', value: 'Commodities' }
];

const TYPE_FILTERS: Array<{ label: string; value: string; icon?: React.ElementType }> = [
  { label: 'All Setups', value: 'ALL' },
  { label: 'Live Setups', value: 'Live Setup', icon: Zap },
  { label: 'Educational', value: 'Educational', icon: BookOpen },
  { label: 'My Theses', value: 'MINE', icon: Sparkles }
];

const POPULAR_TAGS = [
  'PriceAction',
  'Breakout',
  'SMC',
  'FVG',
  'LiquiditySweep',
  'OrderBlock',
  'Educational',
  'LiveSetup'
];

export const CommunityView: React.FC<CommunityViewProps> = ({ onBack, onNavigateTab }) => {
  // Initialize posts cleanly from localStorage with zero mock data
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any legacy dummy mock author names or placeholder post ids
          return parsed.filter(
            (p: CommunityPost) =>
              p &&
              !['post-0', 'post-1', 'post-2', 'post-3', 'post-4'].includes(p.id) &&
              p.authorName !== 'Marcus Sterling' &&
              p.authorName !== 'Elena Rostova' &&
              p.authorName !== 'Vikram Mehta'
          );
        }
      }
    } catch (err) {
      console.warn('Failed to load community posts from storage', err);
    }
    return [];
  });

  // Persistent storage synchronization on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (err) {
      console.warn('Failed to persist community posts to storage', err);
    }
  }, [posts]);
  
  // Modals
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<CommunityPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<CommunityPost | null>(null);
  const [lightboxPost, setLightboxPost] = useState<CommunityPost | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'upvotes' | 'rr'>('newest');

  // Expanded comment sections state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  // New comment input per post
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  // Copy feedback state per post
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Check if post is authored by current user
  const isOwnPost = (post: CommunityPost) => {
    return (
      post.authorName.includes('(You)') ||
      post.authorName.toLowerCase().includes('alex vance') ||
      post.authorName.toLowerCase().includes('alex rivers')
    );
  };

  // Filtered & Sorted Posts
  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        // Market Filter
        if (selectedMarket !== 'ALL' && post.market !== selectedMarket) {
          return false;
        }

        // Type Filter
        if (selectedType === 'MINE') {
          if (!isOwnPost(post)) return false;
        } else if (selectedType !== 'ALL') {
          if (
            post.postType !== selectedType &&
            !post.tags.some(
              (t) => t.toLowerCase() === selectedType.toLowerCase().replace(/\s+/g, '')
            )
          ) {
            return false;
          }
        }

        // Direction Filter
        if (directionFilter !== 'ALL' && post.direction !== directionFilter) {
          return false;
        }

        // Tag Filter
        if (selectedTag) {
          const hasTag = post.tags.some(
            (t) => t.toLowerCase() === selectedTag.toLowerCase()
          );
          if (!hasTag) return false;
        }

        // Search Query (symbol, title, thesis, tags)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchSymbol = post.symbol.toLowerCase().includes(q);
          const matchTitle = post.title.toLowerCase().includes(q);
          const matchThesis = post.thesis.toLowerCase().includes(q);
          const matchAuthor = post.authorName.toLowerCase().includes(q);
          const matchTags = post.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchSymbol && !matchTitle && !matchThesis && !matchAuthor && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'upvotes') {
          return b.likes - a.likes;
        }
        if (sortBy === 'rr') {
          const parseRR = (rr?: number | string) => {
            if (typeof rr === 'number') return rr;
            if (!rr) return 0;
            const match = String(rr).match(/1:([0-9.]+)/);
            return match ? parseFloat(match[1]) : 0;
          };
          return parseRR(b.riskRewardRatio) - parseRR(a.riskRewardRatio);
        }
        // default newest
        return b.id.localeCompare(a.id);
      });
  }, [posts, selectedMarket, selectedType, directionFilter, selectedTag, searchQuery, sortBy]);

  // Toggle Upvote / Like
  const handleLike = (id: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id !== id) return p;
        const currentlyLiked = !!p.isLiked;
        return {
          ...p,
          isLiked: !currentlyLiked,
          likes: currentlyLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
        };
      })
    );
  };

  // Toggle Comments Visibility
  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Add Comment
  const handleAddComment = (postId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: CURRENT_USER_NAME,
      avatar: CURRENT_USER_AVATAR,
      timeAgo: 'Just now',
      text: commentText,
    };

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id !== postId) return p;
        const currentComments = p.comments || [];
        return {
          ...p,
          comments: [...currentComments, newComment],
          commentsCount: currentComments.length + 1,
        };
      })
    );

    // Clear input
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: '',
    }));
  };

  // Delete Comment
  const handleDeleteComment = (postId: string, commentId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id !== postId) return p;
        const updatedComments = (p.comments || []).filter((c) => c.id !== commentId);
        return {
          ...p,
          comments: updatedComments,
          commentsCount: updatedComments.length,
        };
      })
    );
  };

  // Copy Chart to Clipboard
  const handleCopyChart = async (post: CommunityPost, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.chartUrl) return;
    try {
      if (post.chartUrl.startsWith('data:image')) {
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
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 2500);
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(post.chartUrl);
        setCopiedPostId(post.id);
        setTimeout(() => setCopiedPostId(null), 2500);
      }
    }
  };

  // Download Chart Screenshot
  const handleDownloadChart = async (post: CommunityPost, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.chartUrl) return;
    try {
      const cleanSymbol = post.symbol.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${cleanSymbol}_${post.timeframe || 'setup'}.png`;

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
    } catch {
      const a = document.createElement('a');
      a.href = post.chartUrl;
      a.download = `${post.symbol}_chart.png`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Create New Post (from PublishThesisModal)
  const handlePublishPost = (newPost: CommunityPost) => {
    setPosts([newPost, ...posts]);
  };

  // Update Post (from Edit modal)
  const handleSaveEditedPost = (updatedPost: CommunityPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    );
    setPostToEdit(null);
  };

  // Confirm Delete Post
  const handleConfirmDelete = () => {
    if (!postToDelete) return;
    setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postToDelete.id));
    setPostToDelete(null);
    setActiveMenuPostId(null);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedMarket('ALL');
    setSelectedType('ALL');
    setSelectedTag(null);
    setDirectionFilter('ALL');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedMarket !== 'ALL' ||
    selectedType !== 'ALL' ||
    selectedTag !== null ||
    directionFilter !== 'ALL';

  return (
    <div className="space-y-6 pb-16" onClick={() => setActiveMenuPostId(null)}>
      {/* Universal Page Header with Breadcrumbs & Action Button */}
      <PageHeader
        title="Trader Idea Sharing Hub"
        subtitle="Explore high-probability trade setups, institutional SMC breakdowns, and peer chart analyses across Crypto, Stocks, and Forex markets."
        badge={`${posts.length} Live Ideas`}
        badgeVariant="emerald"
        icon={Users}
        breadcrumbs={[{ label: 'Idea Hub', tab: 'community' }]}
        onBack={onBack}
        onNavigateTab={onNavigateTab}
        actionSlot={
          <button
            id="publish-thesis-btn"
            onClick={(e) => {
              e.stopPropagation();
              setPublishModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Trade Thesis</span>
          </button>
        }
      />

      {/* When posts exist, display discovery filters & count banner */}
      {posts.length > 0 && (
        <>
          {/* Top Filter & Discovery Bar */}
          <div className="rounded-xl p-4 bg-[#0E131F] border border-[#1C263C] space-y-3">
            {/* Row 1: Search, Market Selector, Idea Type Tabs, Sort */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ticker (e.g. BTC, NVDA, NIFTY 50), thesis keywords, or trader..."
                  className="w-full bg-[#121827] border border-[#1C263C] rounded-lg pl-8.5 pr-7 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Markets & Direction Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Market Filter Chips */}
                <div className="flex items-center bg-[#121827] p-0.5 rounded-lg border border-[#1C263C] overflow-x-auto">
                  {MARKET_FILTERS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setSelectedMarket(m.value)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedMarket === m.value
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Direction Filter */}
                <div className="flex items-center bg-[#121827] p-0.5 rounded-lg border border-[#1C263C]">
                  <button
                    onClick={() => setDirectionFilter('ALL')}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      directionFilter === 'ALL'
                        ? 'bg-white/15 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setDirectionFilter('LONG')}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      directionFilter === 'LONG'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-emerald-500/60 hover:text-emerald-400'
                    }`}
                  >
                    Longs
                  </button>
                  <button
                    onClick={() => setDirectionFilter('SHORT')}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      directionFilter === 'SHORT'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'text-rose-500/60 hover:text-rose-400'
                    }`}
                  >
                    Shorts
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center bg-[#121827] px-2.5 py-1.5 rounded-lg border border-[#1C263C] gap-1.5 text-xs text-slate-400">
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-slate-200 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="newest" className="bg-[#121827]">Newest First</option>
                    <option value="upvotes" className="bg-[#121827]">Most Upvoted</option>
                    <option value="rr" className="bg-[#121827]">Highest R:R Ratio</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: Idea Type Tabs & Trending Tags */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#1C263C]">
              {/* Post Type Chips */}
              <div className="flex items-center gap-1.5">
                {TYPE_FILTERS.map((tf) => {
                  const Icon = tf.icon;
                  const isSelected = selectedType === tf.value;
                  return (
                    <button
                      key={tf.value}
                      onClick={() => setSelectedType(tf.value)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                          : 'bg-[#121827] text-slate-400 border-[#1C263C] hover:text-white'
                      }`}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      <span>{tf.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Trending Tag Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-500" />
                  <span>Tags:</span>
                </span>
                {POPULAR_TAGS.map((tag) => {
                  const isTagActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(isTagActive ? null : tag)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        isTagActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                          : 'bg-[#121827] text-slate-400 border-[#1C263C] hover:text-slate-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold ml-1 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Count Banner */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-mono">
            <div>
              Showing <span className="text-white font-bold">{filteredPosts.length}</span> of {posts.length} trader theses
              {selectedMarket !== 'ALL' && <span className="text-emerald-400"> in {selectedMarket}</span>}
              {selectedTag && <span className="text-indigo-400"> tagged #{selectedTag}</span>}
            </div>
            <div className="text-[11px] text-slate-500 hidden sm:block">
              💡 Click any chart screenshot to expand in high-res lightbox with zoom & pan
            </div>
          </div>
        </>
      )}

      {/* Post Grid or Empty State */}
      {posts.length === 0 ? (
        <div className="rounded-xl p-8 sm:p-10 border border-[#1C263C] bg-[#0E131F] text-center space-y-6 max-w-2xl mx-auto my-6">
          {/* Glowing Icon Container */}
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="w-16 h-16 rounded-xl bg-[#121827] border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              No Trading Setups Yet
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Be the first trader to share your market analysis or chart setup!
            </p>
          </div>

          {/* Primary CTA */}
          <div>
            <button
              id="empty-state-publish-btn"
              onClick={() => setPublishModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Trade Thesis</span>
            </button>
          </div>

          {/* Feature Highlights / Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#1C263C] text-left">
            <div className="p-3 rounded-lg bg-[#121827] border border-[#1C263C] space-y-1">
              <div className="w-6 h-6 rounded bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Camera className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-white">Attach Screenshots</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Drag-and-drop or paste screenshots directly with <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[9px]">Ctrl+V</kbd>.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#121827] border border-[#1C263C] space-y-1">
              <div className="w-6 h-6 rounded bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-white">Document R:R</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Track exact entry, stop-loss, and take-profit targets with auto-calculated risk reward.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#121827] border border-[#1C263C] space-y-1">
              <div className="w-6 h-6 rounded bg-teal-500/15 text-teal-400 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-white">Peer Discussion</h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Engage in technical critiques, confirmation triggers, and institutional order flow.
              </p>
            </div>
          </div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-xl p-8 border border-[#1C263C] bg-[#0E131F] text-center space-y-4 max-w-lg mx-auto my-6">
          <div className="w-12 h-12 rounded-lg bg-[#121827] border border-[#1C263C] flex items-center justify-center text-slate-400 mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No trading ideas found</h3>
            <p className="text-xs text-slate-400 mt-1">
              No theses match your current search or filter combination.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleClearFilters}
              className="px-3.5 py-1.5 rounded-lg bg-[#121827] hover:bg-[#1A2234] border border-[#1C263C] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
            <button
              onClick={() => setPublishModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Publish New Setup
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPosts.map((post) => {
            const isLong = post.direction === 'LONG';
            const userOwnsThisPost = isOwnPost(post);
            const areCommentsOpen = !!expandedComments[post.id];
            const postComments = post.comments || [];
            const commentInputValue = commentInputs[post.id] || '';
            const isCopied = copiedPostId === post.id;

            return (
              <div
                key={post.id}
                id={`community-post-${post.id}`}
                className="rounded-xl p-5 border border-[#1C263C] space-y-3.5 flex flex-col justify-between transition-all hover:border-[#2D3C5C] relative group bg-[#0E131F]"
              >
                <div className="space-y-3">
                  {/* Top Header Bar: Author Info, Direction Badge, Symbol Ticker, Options */}
                  <div className="flex items-start justify-between gap-2 relative">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-9 h-9 rounded-lg object-cover ring-1 ring-[#1C263C] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-white truncate">
                            {post.authorName}
                          </span>
                          {userOwnsThisPost && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                              YOU
                            </span>
                          )}
                          {post.postType && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                              {post.postType}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <span>{post.timeAgo || post.createdAt}</span>
                          {post.authorBadge && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400">{post.authorBadge}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Direction, Asset Pill, and Menu */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                          isLong
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{post.direction}</span>
                      </span>

                      <span className="text-xs font-mono font-bold text-slate-100 px-2 py-0.5 rounded bg-[#121827] border border-[#1C263C]">
                        {post.symbol}
                      </span>

                      {/* 3-Dot Options Menu for Own Posts */}
                      {userOwnsThisPost && (
                        <div className="relative ml-0.5">
                          <button
                            id={`post-menu-btn-${post.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuPostId(
                                activeMenuPostId === post.id ? null : post.id
                              );
                            }}
                            className="w-7 h-7 rounded text-slate-400 hover:text-white hover:bg-[#121827] transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                            title="Post Options"
                            aria-label="Post options menu"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Options Dropdown Menu */}
                          {activeMenuPostId === post.id && (
                            <div
                              className="absolute right-0 top-8 z-30 w-36 rounded-lg bg-[#121827] border border-[#1C263C] p-1 shadow-xl space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                id={`edit-post-${post.id}`}
                                onClick={() => {
                                  setPostToEdit(post);
                                  setActiveMenuPostId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-bold text-slate-200 hover:text-white hover:bg-[#1A2234] transition-all cursor-pointer text-left"
                              >
                                <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Edit Post</span>
                              </button>
                              <button
                                id={`delete-post-${post.id}`}
                                onClick={() => {
                                  setPostToDelete(post);
                                  setActiveMenuPostId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition-all cursor-pointer text-left"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>Delete Post</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Headline Title */}
                  <h3 className="font-bold text-sm sm:text-base text-white leading-snug">
                    {post.title}
                  </h3>

                  {/* Prominently Highlighted Chart Screenshot */}
                  {post.chartUrl && (
                    <div
                      onClick={() => setLightboxPost(post)}
                      className="relative rounded-lg overflow-hidden border border-[#1C263C] group/chart cursor-pointer bg-[#121827] transition-all hover:border-emerald-500/40"
                      title="Click to view full chart screenshot in lightbox with zoom & pan"
                    >
                      <img
                        src={post.chartUrl}
                        alt={`${post.symbol} trade analysis chart`}
                        className="w-full h-48 sm:h-56 object-cover object-center transition-transform duration-300 group-hover/chart:scale-102"
                      />

                      {/* Top Action Buttons (Copy Link, Download) */}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover/chart:opacity-100 transition-opacity z-10">
                        <button
                          type="button"
                          onClick={(e) => handleCopyChart(post, e)}
                          className="px-2 py-1 rounded bg-[#0E131F]/90 hover:bg-[#121827] border border-[#1C263C] text-slate-200 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md"
                          title="Copy chart image link"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-300" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDownloadChart(post, e)}
                          className="p-1.5 rounded bg-[#0E131F]/90 hover:bg-[#121827] border border-[#1C263C] text-slate-200 hover:text-emerald-400 transition-all cursor-pointer shadow-md"
                          title="Download screenshot image"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Bottom Overlay Info & Expand CTA */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0E131F] via-transparent to-transparent opacity-80 group-hover/chart:opacity-95 transition-opacity flex items-end justify-between p-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0E131F]/90 text-slate-200 border border-[#1C263C]">
                            {post.timeframe} Chart
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            R:R {typeof post.riskRewardRatio === 'number' ? `1:${post.riskRewardRatio}` : post.riskRewardRatio || '1:2.5'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#121827]/90 px-2 py-0.5 rounded border border-[#1C263C] shadow group-hover/chart:bg-emerald-500 group-hover/chart:text-slate-950 transition-colors">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Expand</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detailed Analysis Breakdown & Thesis Description */}
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-[#121827] p-3 rounded-lg border border-[#1C263C] font-sans">
                    {post.thesis}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {post.tags.map((tag, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                            selectedTag === tag
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                              : 'bg-[#121827] border-[#1C263C] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Trading Metrics Bar (R:R, Timeframe, Market) */}
                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <span>R:R:</span>
                      <strong className="text-emerald-400 font-bold">
                        {typeof post.riskRewardRatio === 'number'
                          ? `1:${post.riskRewardRatio}`
                          : post.riskRewardRatio || '1:2.5'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      TF: <strong className="text-slate-200">{post.timeframe || '4H'}</strong>
                    </span>
                    {post.market && (
                      <>
                        <span>•</span>
                        <span>
                          Market: <strong className="text-slate-200">{post.market}</strong>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Bar & Expandable Nested Comments */}
                <div className="border-t border-[#1C263C] pt-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    {/* Upvote Button with Active Liked State */}
                    <button
                      id={`upvote-btn-${post.id}`}
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                        post.isLiked
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-bold'
                          : 'bg-[#121827] border-[#1C263C] text-slate-400 hover:text-white'
                      }`}
                      title={post.isLiked ? 'Remove upvote' : 'Upvote this thesis'}
                    >
                      <ThumbsUp
                        className={`w-3.5 h-3.5 transition-transform ${
                          post.isLiked ? 'fill-emerald-400 text-emerald-400 scale-110' : ''
                        }`}
                      />
                      <span>
                        {post.likes} {post.likes === 1 ? 'Upvote' : 'Upvotes'}
                      </span>
                    </button>

                    {/* Interactive Comments Toggle Button */}
                    <button
                      id={`toggle-comments-btn-${post.id}`}
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                        areCommentsOpen
                          ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 font-bold'
                          : 'bg-[#121827] border-[#1C263C] text-slate-400 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>
                        {post.commentsCount || postComments.length}{' '}
                        {(post.commentsCount || postComments.length) === 1
                          ? 'Comment'
                          : 'Comments'}
                      </span>
                      {areCommentsOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-indigo-400 ml-0.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Inline Nested Comments Section */}
                  {areCommentsOpen && (
                    <div
                      id={`comments-section-${post.id}`}
                      className="pt-2.5 border-t border-[#1C263C] space-y-2.5 animate-in fade-in duration-150"
                    >
                      {/* Comment Feed */}
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {postComments.length === 0 ? (
                          <div className="p-2.5 text-center rounded-lg bg-[#121827] border border-[#1C263C] text-xs text-slate-500">
                            No peer critiques yet. Be the first to analyze this setup!
                          </div>
                        ) : (
                          postComments.map((comment) => {
                            const isUserComment =
                              comment.author.includes('(You)') ||
                              comment.author.toLowerCase().includes('alex vance');

                            return (
                              <div
                                key={comment.id}
                                className="flex items-start gap-2 p-2 rounded-lg bg-[#121827] border border-[#1C263C] text-xs group/comm"
                              >
                                <img
                                  src={comment.avatar}
                                  alt={comment.author}
                                  className="w-5 h-5 rounded object-cover ring-1 ring-[#1C263C] shrink-0 mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-200 text-[11px]">
                                        {comment.author}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        {comment.timeAgo}
                                      </span>
                                    </div>

                                    {isUserComment && (
                                      <button
                                        onClick={() =>
                                          handleDeleteComment(post.id, comment.id)
                                        }
                                        className="opacity-0 group-hover/comm:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                                        title="Delete comment"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-slate-300 mt-0.5 leading-relaxed text-[11px]">
                                    {comment.text}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Add Comment Input Bar */}
                      <form
                        onSubmit={(e) => handleAddComment(post.id, e)}
                        className="flex items-center gap-2 pt-1"
                      >
                        <img
                          src={CURRENT_USER_AVATAR}
                          alt="Your avatar"
                          className="w-6 h-6 rounded object-cover ring-1 ring-[#1C263C] shrink-0 hidden xs:block"
                        />
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={commentInputValue}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            placeholder="Add your critique or trigger..."
                            className="w-full bg-[#121827] border border-[#1C263C] rounded-lg pl-3 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                          <button
                            type="submit"
                            disabled={!commentInputValue.trim()}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-slate-950 font-bold flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed"
                            title="Post comment"
                          >
                            <Send className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Publish Thesis Modal (Creation with multiple upload options, clipboard paste, metadata, tags) */}
      <PublishThesisModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        onPublish={handlePublishPost}
        currentUserName={CURRENT_USER_NAME}
        currentUserAvatar={CURRENT_USER_AVATAR}
      />

      {/* Edit Post Modal (Editing for author's own posts) */}
      <EditPostModal
        isOpen={!!postToEdit}
        post={postToEdit}
        onClose={() => setPostToEdit(null)}
        onSave={handleSaveEditedPost}
      />

      {/* Fullscreen Chart Lightbox Modal with Zoom & Pan */}
      <ChartLightboxModal
        isOpen={!!lightboxPost}
        post={lightboxPost}
        onClose={() => setLightboxPost(null)}
      />

      {/* Delete Confirmation Alert Modal */}
      {postToDelete && (
        <div
          id="delete-post-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 animate-in fade-in duration-150"
          onClick={() => setPostToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-[#0E131F] border border-rose-500/30 rounded-xl p-5 shadow-2xl text-white space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Delete Trade Thesis</h3>
                <p className="text-xs text-slate-400">Permanently remove this community post</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#121827] p-3 rounded-lg border border-[#1C263C]">
              Are you sure you want to delete <strong className="text-white">"{postToDelete.title}"</strong>? This will permanently remove the thesis setup, chart attachment, and all attached peer comments.
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setPostToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-[#121827] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-post-btn"
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Post</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
