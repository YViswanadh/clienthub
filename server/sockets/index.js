import jwt from 'jsonwebtoken';

export const initSocket = (io) => {
  // Authentication Middleware for socket connection handshakes
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Token invalid'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`Socket client connected: ${socket.id} (User ID: ${user.id || user._id}, Role: ${user.role})`);

    // Automatically place user in their respective agency-wide notification room
    const agencyRoom = `agency:${user.agencyId}`;
    socket.join(agencyRoom);
    console.log(`Socket ${socket.id} joined agency room: ${agencyRoom}`);

    // Join a specific project collaboration channel
    socket.on('join_project', (projectId) => {
      if (!projectId) return;
      const projectRoom = `project:${projectId}`;
      socket.join(projectRoom);
      console.log(`Socket ${socket.id} joined project room: ${projectRoom}`);
    });

    // Leave a specific project collaboration channel
    socket.on('leave_project', (projectId) => {
      if (!projectId) return;
      const projectRoom = `project:${projectId}`;
      socket.leave(projectRoom);
      console.log(`Socket ${socket.id} left project room: ${projectRoom}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
};

// Global helper to broadcast project events
export const emitToProject = (io, projectId, event, data) => {
  if (!io || !projectId) return;
  io.to(`project:${projectId}`).emit(event, data);
};
