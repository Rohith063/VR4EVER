import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Send,
  Sparkles,
  Smile,
  X,
  Check,
  Lock,
  Globe,
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import { useRelationship } from '../context/RelationshipContext';

const FEED_TAGS = ['All', '#love', '#milestone', '#date', '#daily', '#thoughts'] as const;

export const FeedsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { partnerProfile } = useRelationship();
  const { posts, createPost, toggleLike, getComments, addComment, openUserProfile, friends } = useSocial();

  const [activeTag, setActiveTag] = useState<string>('All');
  const [postContent, setPostContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('#love');
  const [postVisibility, setPostVisibility] = useState<'public' | 'private'>('public');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [openCommentsForPost, setOpenCommentsForPost] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [copiedLinkPostId, setCopiedLinkPostId] = useState<string | null>(null);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !imageUrl.trim()) return;

    createPost(
      postContent.trim(),
      imageUrl.trim() || null,
      imageUrl.trim() ? 'image' : null,
      selectedTag,
      postVisibility
    );

    setPostContent('');
    setImageUrl('');
    setShowImageInput(false);
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(postId, commentInput.trim());
    setCommentInput('');
  };

  const handleShare = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/feeds#${postId}`);
    setCopiedLinkPostId(postId);
    setTimeout(() => setCopiedLinkPostId(null), 2000);
  };

  const filteredPosts = posts.filter((p) => {
    if (activeTag !== 'All' && p.tag !== activeTag) return false;

    // Privacy rule: private posts are only visible to author, approved friends, or partner
    if (p.visibility === 'private') {
      const isAuthor = user && (p.author_id === user.id || p.author_id === 'me');
      const isFriend = friends.includes(p.author_id);
      const isPartner = partnerProfile && p.author_id === partnerProfile.id;
      if (!isAuthor && !isFriend && !isPartner) return false;
    }

    return true;
  });

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 pt-4 px-2 sm:px-0 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
            4EVER Feed
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            Realtime updates, couple milestones & daily thoughts
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Realtime Live</span>
        </div>
      </div>

      {/* Post Composer Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl border border-white/10 p-4 sm:p-5 shadow-xl space-y-3"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 text-sm overflow-hidden shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Me" className="w-full h-full object-cover" />
            ) : (
              profile?.display_name?.slice(0, 1) || 'U'
            )}
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What's on your mind? Share a real moment or update..."
              rows={3}
              className="w-full bg-transparent border-none text-sm text-white placeholder-white/40 focus:outline-none resize-none"
            />

            {/* Attached image preview */}
            {imageUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-white/15 max-h-60 bg-black/40">
                <img src={imageUrl} alt="Upload preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Image URL input toggle */}
            {showImageInput && !imageUrl && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL (e.g. Unsplash or photo link)..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowImageInput(false)}
                  className="text-xs text-white/40 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Composer Footer Tools */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowImageInput((prev) => !prev)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-amber-300 transition-colors cursor-pointer"
                  title="Add photo"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* Tag selector */}
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-300 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="#love" className="bg-[#12131a] text-white">#love</option>
                  <option value="#milestone" className="bg-[#12131a] text-white">#milestone</option>
                  <option value="#date" className="bg-[#12131a] text-white">#date</option>
                  <option value="#daily" className="bg-[#12131a] text-white">#daily</option>
                  <option value="#thoughts" className="bg-[#12131a] text-white">#thoughts</option>
                </select>

                {/* Public vs Private toggle */}
                <div className="flex p-0.5 rounded-xl bg-white/5 border border-white/10 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPostVisibility('public')}
                    className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                      postVisibility === 'public'
                        ? 'bg-amber-400 text-black font-bold'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostVisibility('private')}
                    className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                      postVisibility === 'private'
                        ? 'bg-rose-500 text-white font-bold'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>Private</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreatePost}
                disabled={!postContent.trim() && !imageUrl.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-40 transition-all cursor-pointer"
              >
                <span>Post</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tag filter row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FEED_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTag === tag
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-3xl border border-white/10 space-y-3">
            <Smile className="w-10 h-10 text-white/30 mx-auto" />
            <p className="text-sm text-white/70 font-medium">None</p>
            <p className="text-xs text-white/40 max-w-xs mx-auto">
              No posts in this feed yet. Write your thoughts above and share your first moment!
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isCommentsOpen = openCommentsForPost === post.id;
            const postComments = getComments(post.id);

            return (
              <motion.article
                key={post.id}
                id={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-3xl border border-white/10 p-5 shadow-xl space-y-4 transition-all"
              >
                {/* Author Info & Timestamp */}
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => openUserProfile(post.author_id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center justify-center text-xs overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-amber-400 transition-all">
                      {post.author_avatar ? (
                        <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                      ) : (
                        post.author_name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                          {post.author_name}
                        </span>
                        <span className="text-xs text-white/40">
                          @{post.author_username}
                        </span>
                      </div>
                      <span className="text-[11px] text-white/40">
                        {formatTimeAgo(post.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Privacy Badge */}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 border border-white/10 text-white/60 flex items-center gap-1">
                      {post.visibility === 'private' ? (
                        <>
                          <Lock className="w-2.5 h-2.5 text-rose-300" />
                          <span>Private</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-2.5 h-2.5 text-emerald-300" />
                          <span>Public</span>
                        </>
                      )}
                    </span>

                    {/* Tag Badge */}
                    {post.tag && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {post.tag}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-white/90 leading-relaxed font-sans whitespace-pre-line">
                  {post.content}
                </p>

                {/* Media Attachment */}
                {post.media_url && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 max-h-[420px] bg-black/40">
                    {post.media_type === 'video' ? (
                      <video src={post.media_url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={post.media_url}
                        alt="Post media"
                        className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-300"
                      />
                    )}
                  </div>
                )}

                {/* Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-4">
                    {/* Like Button */}
                    <button
                      type="button"
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                        post.is_liked_by_me
                          ? 'text-rose-400 bg-rose-500/15 font-semibold'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 transition-transform active:scale-125 ${
                          post.is_liked_by_me ? 'fill-rose-400 text-rose-400' : ''
                        }`}
                      />
                      <span>{post.likes_count}</span>
                    </button>

                    {/* Comments Toggle */}
                    <button
                      type="button"
                      onClick={() => setOpenCommentsForPost(isCommentsOpen ? null : post.id)}
                      className={`flex items-center gap-1.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                        isCommentsOpen
                          ? 'text-amber-300 bg-amber-500/15 font-semibold'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments_count}</span>
                    </button>
                  </div>

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-1 py-1 px-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedLinkPostId === post.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium text-[11px]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Share</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Expandable Comments Drawer */}
                <AnimatePresence>
                  {isCommentsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-3 border-t border-white/5 space-y-3"
                    >
                      {/* Comment Input */}
                      <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400/50"
                        />
                        <button
                          type="submit"
                          disabled={!commentInput.trim()}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 disabled:opacity-30 transition-all cursor-pointer"
                        >
                          Send
                        </button>
                      </form>

                      {/* Comments List */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {postComments.length === 0 ? (
                          <p className="text-xs text-white/40 text-center py-2">No comments yet.</p>
                        ) : (
                          postComments.map((c) => (
                            <div key={c.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span
                                  className="font-semibold text-amber-300 hover:underline cursor-pointer"
                                  onClick={() => openUserProfile(c.author_id)}
                                >
                                  @{c.author_username}
                                </span>
                                <span className="text-[10px] text-white/40">
                                  {formatTimeAgo(c.created_at)}
                                </span>
                              </div>
                              <p className="text-white/80">{c.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })
        )}
      </div>
    </div>
  );
};
