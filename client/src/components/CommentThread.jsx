import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import axios from '../lib/axios';
import Button from './ui/button';
import Input from './ui/input';

export default function CommentThread({ projectId }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [sending, setSending] = useState(false);
  
  const bottomRef = useRef(null);

  // Fetch comments history
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

  // Real-time socket rooms
  useEffect(() => {
    if (!socket || !projectId) return;

    socket.emit('join_project', projectId);

    const handleNewComment = (data) => {
      const incomingComment = data.comment;
      setComments((prev) => {
        if (prev.some((c) => c._id === incomingComment._id || c.id === incomingComment.id)) {
          return prev;
        }
        return [...prev, incomingComment];
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
      const response = await axios.post(`/comments/project/${projectId}`, {
        body: textToSend,
      });

      const postedComment = response.data.comment;

      setComments((prev) => {
        if (prev.some((c) => c._id === postedComment._id || c.id === postedComment.id)) {
          return prev;
        }
        return [...prev, postedComment];
      });
      scrollToBottom();
    } catch (err) {
      console.error('Failed to post comment:', err);
      setNewCommentText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="flex flex-col h-[500px] border border-outline-variant bg-surface rounded-DEFAULT overflow-hidden font-body-md">
      {/* Scrollable Conversation Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-surface-container-low">
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
            <span className="material-symbols-outlined text-[36px] text-on-surface-variant mb-2">forum</span>
            <p className="font-semibold text-primary text-sm">No discussions yet</p>
            <p className="text-xs text-on-surface-variant mt-1">Start the conversation by sending a message below.</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isMe = comment.authorId?._id === user?.id || comment.authorId === user?.id;
            const authorName = comment.authorId?.name || 'Member';
            const initials = getUserInitials(authorName);
            const formattedTime = comment.createdAt 
              ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : '';

            return (
              <div 
                key={comment.id || comment._id || Math.random().toString()} 
                className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {/* Other User Avatar Icon */}
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center font-bold text-xs text-primary select-none shrink-0 mb-1">
                    {initials}
                  </div>
                )}

                {/* Chat Bubble card */}
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`
                      px-4 py-3 rounded-xl border font-body-md text-sm leading-relaxed
                      ${isMe 
                        ? 'bg-surface border-outline-variant text-on-surface rounded-br-none' 
                        : 'bg-surface-container-high border-outline-variant text-on-surface rounded-bl-none'
                      }
                    `}
                  >
                    {!isMe && (
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                        {authorName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{comment.body}</p>
                  </div>
                  <span className="text-[9px] text-on-surface-variant mt-1 font-mono font-medium">
                    {formattedTime}
                  </span>
                </div>

                {/* My Avatar Icon */}
                {isMe && (
                  <div className="w-8 h-8 rounded-full bg-primary border border-primary flex items-center justify-center font-bold text-xs text-on-primary select-none shrink-0 mb-1">
                    {initials}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message Composer Footer Form */}
      <form onSubmit={handleSend} className="p-3 bg-surface border-t border-outline-variant flex gap-3 items-center">
        <div className="flex-1">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Write a message..."
            disabled={sending}
            className="w-full px-4 py-3 bg-surface-bright border border-outline-variant text-on-surface font-body-md text-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors duration-150 rounded-DEFAULT"
          />
        </div>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={!newCommentText.trim() || sending}
          iconRight="send"
          className="py-3 px-4 shrink-0"
        >
          {sending ? '...' : ''}
        </Button>
      </form>
    </div>
  );
}
