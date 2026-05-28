import { Router } from 'express';
import { z } from 'zod';
import { Comment } from '../models/Comment.js';
import { Project } from '../models/Project.js';
import { ApiError } from '../utils/apiError.js';
import { auth } from '../middleware/auth.js';
import { tenancy } from '../middleware/tenancy.js';
import { validate } from '../middleware/validate.js';
import { io } from '../server.js';
import { emitToProject } from '../sockets/index.js';

const router = Router();

const commentCreateSchema = z.object({
  body: z.string().min(1, 'Comment body cannot be empty'),
  fileId: z.string().optional(),
  type: z.enum(['comment', 'approval_request', 'approved', 'rejected']).default('comment'),
});

// GET /project/:projectId — Retrieve comments paginated, sorted by newest first
router.get('/project/:projectId', auth, tenancy, async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to agency
    const project = await Project.findOne({ _id: projectId, agencyId: req.agency._id });
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Security: Client can only read comments of their own projects
    if (req.user.role === 'client' && project.clientId.toString() !== req.user.id) {
      throw new ApiError(403, 'Forbidden: Insufficient permissions');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'name role avatar');

    const totalComments = await Comment.countDocuments({ projectId });

    res.json({
      success: true,
      comments,
      pagination: {
        page,
        limit,
        total: totalComments,
        pages: Math.ceil(totalComments / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /project/:projectId — Add new comment, populate author, broadcast via sockets
router.post('/project/:projectId', auth, tenancy, validate(commentCreateSchema), async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to agency
    const project = await Project.findOne({ _id: projectId, agencyId: req.agency._id });
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Security: Client can only post to their own projects
    if (req.user.role === 'client' && project.clientId.toString() !== req.user.id) {
      throw new ApiError(403, 'Forbidden: Insufficient permissions');
    }

    const newComment = await Comment.create({
      projectId,
      authorId: req.user.id,
      body: req.body.body,
      fileId: req.body.fileId,
      type: req.body.type,
    });

    const populatedComment = await newComment.populate('authorId', 'name role avatar');

    emitToProject(io, projectId, 'new_comment', {
      comment: populatedComment,
      authorName: req.user.name || populatedComment.authorId.name,
    });

    res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
