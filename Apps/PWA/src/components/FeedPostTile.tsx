import React, { useState } from 'react';
import { Post } from '../types';

interface FeedPostTileProps {
  post: Post;
  onLikeToggle?: (postId: string) => void;
  isLiked?: boolean;
}

export const FeedPostTile: React.FC<FeedPostTileProps> = ({ post, onLikeToggle, isLiked }) => {
  const [imgError, setImgError] = useState(false);
  const initialLetter = (post.author.username || 'U').charAt(0).toUpperCase();

  return (
    <article 
      data-testid={`post-tile-${post.id}`}
      className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4 backdrop-blur-md transition-all hover:border-indigo-500/40"
    >
      {/* Header: Author & Source */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {!imgError && post.author.thumbnailUrl ? (
            <img
              src={post.author.thumbnailUrl}
              alt={post.author.username}
              onError={() => setImgError(true)}
              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-indigo-500/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center font-bold text-white text-sm shadow-md ring-2 ring-indigo-500/20">
              {initialLetter}
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              {post.author.username}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {new Date(post.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Source Badge */}
        <span 
          data-testid="source-badge"
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mr-2"></span>
          {post.source.name}
        </span>
      </div>

      {/* Post Content */}
      <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line">
        {post.content}
      </p>

      {/* Footer: Stats & Engagement Actions */}
      <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/60">
        <button
          type="button"
          onClick={() => onLikeToggle?.(post.id)}
          data-testid={`like-button-${post.id}`}
          className={`flex items-center space-x-1.5 py-1 px-2.5 rounded-xl transition-all ${
            isLiked
              ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
          <span className="font-semibold">{post.stats.likeCount + (isLiked ? 1 : 0)}</span>
        </button>

        <div className="flex items-center space-x-1.5 py-1 px-2.5">
          <span>💬</span>
          <span className="font-semibold">{post.stats.commentCount} comments</span>
        </div>
      </div>
    </article>
  );
};

export default FeedPostTile;
