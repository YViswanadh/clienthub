import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuth from './useAuth';
import { getToken } from '../context/AuthContext';

export default function useSocket() {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setSocket(null);
      return;
    }

    const socketInstance = io(window.location.origin, {
      auth: { token },
      transports: ['websocket'],
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]); // Rebuild when user state changes (login/logout)

  return socket;
}
