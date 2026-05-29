import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import axios from '../lib/axios';

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

  return (
    <div>
      <h3>Discussion</h3>

      <div style={{ maxHeight: '300px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
        {comments.length === 0 ? (
          <p>No discussion items yet. Start the conversation below.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id || comment._id || Math.random().toString()} style={{ margin: '8px 0' }}>
              <strong>{comment.authorId?.name || 'Member'}</strong> ({comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString() : ''}):
              <p style={{ margin: '4px 0 0 0' }}>{comment.body}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend}>
        <input
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Write a message..."
          disabled={sending}
        />
        <button type="submit" disabled={!newCommentText.trim() || sending}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
