import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import axios from '../lib/axios';
import { Send, MessageSquare, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function CommentThread({ projectId, initialComments = [] }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [comments, setComments] = useState(initialComments);
  const [newCommentText, setNewCommentText] = useState('');
  const [sending, setSending] = useState(false);
  
  const bottomRef = useRef(null);

  // Sync state if initialComments changes
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Real-time socket room joining and listening
  useEffect(() => {
    if (!socket || !projectId) return;

    // Join room
    socket.emit('join_project', { projectId });

    // Listen for new comments
    const handleNewComment = (comment) => {
      // Avoid duplicate keys
      setComments((prev) => {
        if (prev.some((c) => c._id === comment._id || c.id === comment.id)) {
          return prev;
        }
        return [...prev, comment];
      });
      scrollToBottom();
    };

    socket.on('new_comment', handleNewComment);

    return () => {
      socket.emit('leave_project', { projectId });
      socket.off('new_comment', handleNewComment);
    };
  }, [socket, projectId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || sending) return;

    const textToSend = newCommentText.trim();
    setNewCommentText('');
    setSending(true);

    try {
      // POST to standard MERN route: /api/projects/:id/comments
      const response = await axios.post(`/projects/${projectId}/comments`, {
        text: textToSend,
      });

      // Append to comments state immediately if not already handled by socket
      setComments((prev) => {
        const comment = response.data;
        if (prev.some((c) => c._id === comment._id || c.id === comment.id)) {
          return prev;
        }
        return [...prev, comment];
      });
      scrollToBottom();
    } catch (err) {
      console.error('Failed to post comment:', err);
      setNewCommentText(textToSend); // Restore text on error
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
    <div className="flex flex-col border border-[#EEEDFE] bg-white rounded-xl h-[450px] shadow-sm overflow-hidden">
      {/* Thread Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-[#111111]">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span>Project Discussion</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="h-10 w-10 bg-gray-50 text-[#6B7280] rounded-full flex items-center justify-center mb-2">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-[#111111]">No messages yet</p>
            <p className="text-xs text-[#6B7280]">Start the conversation below.</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isMe = comment.sender?.id === user?.id || comment.sender?._id === user?.id;
            return (
              <div
                key={comment.id || comment._id || Math.random().toString()}
                className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={comment.sender?.avatar} alt={comment.sender?.name} />
                  <AvatarFallback className="bg-primary-light text-primary text-xs font-semibold">
                    {comment.sender?.name ? comment.sender.name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="h-3.5 w-3.5" />}
                  </AvatarFallback>
                </Avatar>

                {/* Message Bubble */}
                <div className="space-y-1">
                  {/* Sender Name & Role */}
                  {!isMe && (
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-xs font-semibold text-[#111111]">
                        {comment.sender?.name}
                      </span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-[#6B7280]">
                        {comment.sender?.role}
                      </span>
                    </div>
                  )}

                  <div
                    className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                      isMe
                        ? 'bg-primary text-white font-sans'
                        : 'bg-[#F8F8F8] text-[#111111] border border-gray-100'
                    }`}
                  >
                    {comment.text}
                  </div>

                  <div className={`px-1 text-[10px] text-[#6B7280] ${isMe ? 'text-right' : 'text-left'}`}>
                    {formatTime(comment.createdAt || comment.date)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Action Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-100 bg-white flex gap-2">
        <Input
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 rounded-lg focus-visible:ring-primary border-gray-200 text-sm py-2"
          disabled={sending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!newCommentText.trim() || sending}
          className="rounded-lg bg-primary hover:bg-primary/95 text-white w-10 h-10 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
