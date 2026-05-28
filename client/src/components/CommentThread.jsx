import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import axios from '../lib/axios';
import { Send, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function CommentThread({ projectId, initialComments = [] }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [sending, setSending] = useState(false);
  
  const bottomRef = useRef(null);

  // Fetch comments history directly from the backend to align with full schemas
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`/comments/project/${projectId}`);
        setComments(response.data.comments || []);
        scrollToBottom();
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    };
    if (projectId) {
      fetchComments();
    }
  }, [projectId]);

  // Real-time socket room joining and listening
  useEffect(() => {
    if (!socket || !projectId) return;

    socket.emit('join_project', projectId);

    const handleNewComment = (data) => {
      const incomingComment = data.comment;
      setComments((prev) => {
        if (prev.some((c) => c._id === incomingComment._id || c.id === incomingComment.id)) {
          return prev;
        }
        return [...prev, { ...incomingComment, isNew: true }];
      });
      scrollToBottom();
    };

    socket.on('new_comment', handleNewComment);

    return () => {
      socket.emit('leave_project', projectId);
      socket.off('new_comment', handleNewComment);
    };
  }, [socket, projectId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || sending) return;

    const textToSend = newCommentText.trim();
    setNewCommentText('');
    setSending(true);

    try {
      // POST directly to the secure comment routes aligning with Zod body schema
      const response = await axios.post(`/comments/project/${projectId}`, {
        body: textToSend,
      });

      const postedComment = response.data.comment;

      setComments((prev) => {
        if (prev.some((c) => c._id === postedComment._id || c.id === postedComment.id)) {
          return prev;
        }
        return [...prev, { ...postedComment, isNew: true }];
      });
      scrollToBottom();
    } catch (err) {
      console.error('Failed to post comment:', err);
      setNewCommentText(textToSend); // Restore text on fail
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="flex flex-col bg-white border flex-1 h-[450px] shadow-sm overflow-hidden" style={{ borderColor: 'var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-base)' }}>
        <span className="text-xs font-semibold text-[#0E0E1A]">Discussion</span>
      </div>

      {/* Slide-down keyframes inject */}
      <style>{`
        @keyframes bubbleSlide {
          from { max-height: 0; opacity: 0; transform: translateY(8px); }
          to { max-height: 200px; opacity: 1; transform: translateY(0); }
        }
        .comment-slide-new {
          animation: bubbleSlide 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          overflow: hidden;
        }
      `}</style>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-xs text-[#94A3B8] m-0">No discussion items yet</p>
            <p className="text-[10px] text-[#94A3B8]/70 mt-1 m-0">Start the conversation below.</p>
          </div>
        ) : (
          comments.map((comment) => {
            const authorRole = comment.authorId?.role || 'client';
            const isAgencyComment = authorRole === 'agency';
            
            return (
              <div
                key={comment.id || comment._id || Math.random().toString()}
                className={`flex gap-3 max-w-[85%] ${
                  isAgencyComment ? 'ml-auto flex-row-reverse' : 'mr-auto'
                } ${comment.isNew ? 'comment-slide-new' : ''}`}
              >
                {/* User initials circle */}
                <Avatar className="h-8 w-8 border shrink-0" style={{ borderColor: 'var(--border-light)' }}>
                  <AvatarImage src={comment.authorId?.avatar} alt={comment.authorId?.name} />
                  <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {comment.authorId?.name
                      ? comment.authorId.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                      : <User className="h-3.5 w-3.5" />}
                  </AvatarFallback>
                </Avatar>

                {/* Bubble box */}
                <div className="space-y-1">
                  {!isAgencyComment && (
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-[11px] font-semibold text-[#0E0E1A]">
                        {comment.authorId?.name || 'Client Member'}
                      </span>
                    </div>
                  )}

                  <div
                    className="px-4 py-2 text-sm leading-normal font-sans break-words"
                    style={{
                      backgroundColor: isAgencyComment ? 'var(--electric-muted)' : 'var(--bg-base)',
                      color: 'var(--text-primary)',
                      borderRadius: isAgencyComment
                        ? '12px 12px 4px 12px'
                        : '12px 12px 12px 4px',
                    }}
                  >
                    {comment.body}
                  </div>

                  <span className={`text-[10px] text-[#94A3B8] block px-1 ${isAgencyComment ? 'text-right' : 'text-left'}`}>
                    {formatTime(comment.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Action Form */}
      <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2 shrink-0" style={{ borderColor: 'var(--border-light)' }}>
        <input
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Write a message..."
          disabled={sending}
          className="flex-1 px-3 rounded-lg outline-none transition-all text-xs"
          style={{
            height: '36px',
            border: '1px solid var(--border)',
            backgroundColor: '#ffffff',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--brand-color, var(--electric))')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
        <button
          type="submit"
          disabled={!newCommentText.trim() || sending}
          className="flex items-center justify-center rounded-lg text-white shrink-0 hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none"
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: 'var(--brand-color, var(--electric))',
          }}
        >
          {sending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-4 w-4 text-white" />
          )}
        </button>
      </form>
    </div>
  );
}
