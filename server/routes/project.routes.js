import { Router } from 'express';
import { z } from 'zod';
import { Project } from '../models/Project.js';
import { File } from '../models/File.js';
import { Comment } from '../models/Comment.js';
import { ApiError } from '../utils/apiError.js';
import { auth } from '../middleware/auth.js';
import { tenancy } from '../middleware/tenancy.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { io } from '../server.js';
import { emitToProject } from '../sockets/index.js';
import { cloudinary } from '../config/cloudinary.js';

const router = Router();

const projectCreateSchema = z.object({
  clientId: z.string().min(1, 'Client reference ID is required'),
  title: z.string().min(1, 'Project title is required'),
  description: z.string().optional(),
  budget: z.number().nonnegative('Budget must be positive').optional(),
  dueDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  phases: z
    .array(
      z.object({
        name: z.string().min(1, 'Phase name is required'),
        done: z.boolean().default(false),
      })
    )
    .optional(),
  tags: z.array(z.string()).optional(),
});

const projectUpdateSchema = z.object({
  title: z.string().min(1, 'Project title cannot be empty').optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'review', 'done']).optional(),
  budget: z.number().nonnegative('Budget must be positive').optional(),
  dueDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  phases: z
    .array(
      z.object({
        name: z.string(),
        done: z.boolean(),
      })
    )
    .optional(),
  tags: z.array(z.string()).optional(),
});

const phaseUpdateSchema = z.object({
  phaseIndex: z.number().int().nonnegative('Phase index must be a non-negative integer'),
  done: z.boolean(),
});

// GET / — List projects for this agency, filtered by status & clientId, scoped to client if role is client
router.get('/', auth, tenancy, async (req, res, next) => {
  try {
    const filter = { agencyId: req.agency._id };

    if (req.user.role === 'client') {
      filter.clientId = req.user.id;
    } else if (req.query.clientId) {
      filter.clientId = req.query.clientId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const projects = await Project.find(filter).populate('clientId', 'name email avatar');
    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    next(error);
  }
});

// GET /:id — Get single project with populated files and latest 20 comments
router.get('/:id', auth, tenancy, async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, agencyId: req.agency._id };
    if (req.user.role === 'client') {
      filter.clientId = req.user.id;
    }

    const project = await Project.findOne(filter).populate('clientId', 'name email avatar');
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const files = await File.find({ projectId: project._id }).populate('uploadedBy', 'name role avatar');
    const comments = await Comment.find({ projectId: project._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('authorId', 'name role avatar');

    res.json({
      success: true,
      project,
      files,
      comments,
    });
  } catch (error) {
    next(error);
  }
});

// POST / — Create project (agency only)
router.post('/', auth, tenancy, requireRole('agency'), validate(projectCreateSchema), async (req, res, next) => {
  try {
    const newProject = await Project.create({
      ...req.body,
      agencyId: req.agency._id,
    });

    res.status(201).json({
      success: true,
      project: newProject,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /:id — Update project (agency only)
router.put('/:id', auth, tenancy, requireRole('agency'), validate(projectUpdateSchema), async (req, res, next) => {
  try {
    const updatedProject = await Project.findOneAndUpdate(
      { _id: req.params.id, agencyId: req.agency._id },
      { $set: req.body },
      { new: true }
    ).populate('clientId', 'name email avatar');

    if (!updatedProject) {
      throw new ApiError(404, 'Project not found');
    }

    emitToProject(io, updatedProject._id.toString(), 'project_updated', updatedProject);

    res.json({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /:id — Delete project and all associated files/comments (agency only)
router.delete('/:id', auth, tenancy, requireRole('agency'), async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, agencyId: req.agency._id });
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Retrieve and purge all Cloudinary assets associated with files in this project
    const files = await File.find({ projectId: project._id });
    for (const file of files) {
      if (file.cloudinaryPublicId) {
        try {
          await cloudinary.uploader.destroy(file.cloudinaryPublicId);
        } catch (cloudinaryErr) {
          console.error(`Failed to delete Cloudinary asset ${file.cloudinaryPublicId}:`, cloudinaryErr.message);
        }
      }
    }

    // Delete database records
    await File.deleteMany({ projectId: project._id });
    await Comment.deleteMany({ projectId: project._id });
    await Project.findByIdAndDelete(project._id);

    res.json({
      success: true,
      message: 'Project and all associated comments/files deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /:id/phase — Toggle phase completion state (available to authenticated members with project access)
router.patch('/:id/phase', auth, tenancy, validate(phaseUpdateSchema), async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, agencyId: req.agency._id };
    if (req.user.role === 'client') {
      filter.clientId = req.user.id;
    }

    const project = await Project.findOne(filter);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const { phaseIndex, done } = req.body;
    if (phaseIndex < 0 || phaseIndex >= project.phases.length) {
      throw new ApiError(400, 'Invalid phase index');
    }

    project.phases[phaseIndex].done = done;
    await project.save();

    const updatedProject = await Project.findById(project._id).populate('clientId', 'name email avatar');
    emitToProject(io, project._id.toString(), 'project_updated', updatedProject);

    res.json({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
