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
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';

const FEED_TAGS = ['All', '#love', '#milestone', '#date', '#daily', '#thoughts'] as const;

export const FeedsPage: React.FC = () => {
  const { profile } = useAuth();
  const { posts, createPost, toggleLike, getComments, addComment } = useSocial();

  const [activeTag, setActiveTag] = useState<string>('All');
  const [postContent, setPostContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('#love');
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
      selectedTag
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

  const filteredPosts = activeTag === 'All' ? posts : posts.filter((p) => p.tag === activeTag);

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
    <div className="max-w-2xl mx-auto space-y-6 pb-24 pt-4 px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
            4EVER Feed
          </h1>
          <p className="text-xs text-white/50">
            Share moments, love stories & daily thoughts
          </p>
        </div>
        <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      {/* Post Composer (Instagram/Threads card style) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl border border-white/10 p-4 sm:p-5 shadow-xl space-y-4"
      >
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-black font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden shadow-md">
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
              placeholder="What's on your mind? Share a thought or couple moment..."
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
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white"
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
                  className="text-xs text-white/40 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Composer Footer Tools */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageInput((prev) => !prev)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-amber-300 transition-colors"
                  title="Add photo"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* Tag selector */}
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-300 font-medium focus:outline-none"
                >
                  <option value="#love" className="bg-[#12131a] text-white">#love</option>
                  <option value="#milestone" className="bg-[#12131a] text-white">#milestone</option>
                  <option value="#date" className="bg-[#12131a] text-white">#date</option>
                  <option value="#daily" className="bg-[#12131a] text-white">#daily</option>
                  <option value="#thoughts" className="bg-[#12131a] text-white">#thoughts</option>
                </select>
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
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
            <p className="text-sm text-white/70 font-medium">No posts in this category yet</p>
            <p className="text-xs text-white/40">Be the first to share a post!</p>
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center justify-center text-xs overflow-hidden shrink-0">
                      {post.author_avatar ? (
                        <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                      ) : (
                        post.author_name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white hover:underline cursor-pointer">
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

                  {post.tag && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      {post.tag}
                    </span>
                  )}
                </div>

                {/* Post Content */}
                <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>

                {/* Media Image */}
                {post.media_url && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 max-h-96">
                    <img
                      src={post.media_url}
                      alt="Post attachment"
                      className="w-full h-full object-cover max-h-96 hover:scale-[1.01] transition-transform"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Action Buttons Row (Like, Comment, Share) */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-4">
                    {/* Like Button */}
                    <button
                      type="button"
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 font-medium transition-all active:scale-125 ${
                        post.is_liked_by_me ? 'text-rose-400' : 'text-white/60 hover:text-rose-400'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          post.is_liked_by_me ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                      <span>{post.likes_count}</span>
                    </button>

                    {/* Comment Toggle Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setOpenCommentsForPost((prev) => (prev === post.id ? null : post.id))
                      }
                      className="flex items-center gap-1.5 text-white/60 hover:text-white font-medium transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments_count}</span>
                    </button>
                  </div>

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-1 text-white/40 hover:text-white transition-colors"
                    title="Copy share link"
                  >
                    {copiedLinkPostId === post.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px] text-emerald-300">Copied</span>
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
                      className="pt-3 border-t border-white/10 space-y-3 overflow-hidden"
                    >
                      {/* Comments list */}
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {postComments.length === 0 ? (
                          <p className="text-xs text-white/40 italic py-2">No comments yet. Say something sweet!</p>
                        ) : (
                          postComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5 text-xs"
                            >
                              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {comment.author_name.slice(0, 1)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-white/90">
                                    {comment.author_name}
                                  </span>
                                  <span className="text-[10px] text-white/40">
                                    {formatTimeAgo(comment.created_at)}
                                  </span>
                                </div>
                                <p className="text-white/80 mt-0.5">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Input Form */}
                      <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex gap-2">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-amber-400/50"
                        />
                        <button
                          type="submit"
                          disabled={!commentInput.trim()}
                          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-40 transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
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
