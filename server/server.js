import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import { initSocket } from './sockets/index.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import agencyRoutes from './routes/agency.routes.js';
import projectRoutes from './routes/project.routes.js';
import fileRoutes from './routes/file.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import commentRoutes from './routes/comment.routes.js';
import aiRoutes from './routes/ai.routes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io integration attached to HTTP server
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Initialize sockets middleware & event listeners
initSocket(io);

// Security Headers & CORS
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Route-specific parser: raw body ONLY on Stripe webhook, else standard JSON body parsing
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), invoiceRoutes);
app.use(express.json());

// API Rate Limiting: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

// Apply rate limiter to all API endpoints
app.use('/api', apiLimiter);

// Mount Route skeletons
app.use('/api/auth', authRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ai', aiRoutes);

// Root base routing
app.get('/', (req, res) => {
  res.json({ success: true, message: 'ClientHub Backend API is fully active' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Log unexpected server errors
  if (!err.statusCode || err.statusCode >= 500) {
    console.error('Unexpected Server Error:', err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

// Connect to Database and start listening
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`ClientHub backend server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database or start server:', error.message);
    process.exit(1);
  }
};

startServer();
