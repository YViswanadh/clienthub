import { Router } from 'express';
import { File } from '../models/File.js';
import { Project } from '../models/Project.js';
import { ApiError } from '../utils/apiError.js';
import { auth } from '../middleware/auth.js';
import { tenancy } from '../middleware/tenancy.js';
import { upload } from '../middleware/upload.js';
import { io } from '../server.js';
import { emitToProject } from '../sockets/index.js';
import { cloudinary } from '../config/cloudinary.js';

const router = Router();

// POST /upload — Upload a single file, save details to DB, scope to project, emit file_uploaded
router.post('/upload', auth, tenancy, upload.single('file'), async (req, res, next) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      throw new ApiError(400, 'Project ID is required');
    }

    if (!req.file) {
      throw new ApiError(400, 'File upload failed or file is missing');
    }

    // Verify tenancy of project
    const project = await Project.findOne({ _id: projectId, agencyId: req.agency._id });
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Security: Clients can only upload to their own projects
    if (req.user.role === 'client' && project.clientId.toString() !== req.user.id) {
      throw new ApiError(403, 'Forbidden: Insufficient permissions');
    }

    const newFile = await File.create({
      projectId,
      uploadedBy: req.user.id,
      filename: req.file.originalname,
      cloudinaryUrl: req.file.path, // multer-storage-cloudinary secure URL
      cloudinaryPublicId: req.file.filename, // multer-storage-cloudinary public ID
      size: req.file.size,
      mimeType: req.file.mimetype,
    });

    const populatedFile = await newFile.populate('uploadedBy', 'name role avatar');

    emitToProject(io, projectId, 'file_uploaded', populatedFile);

    res.status(201).json({
      success: true,
      file: populatedFile,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /:id/approve — Toggle file approval, save approver context, emit file_approved
router.patch('/:id/approve', auth, tenancy, async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id).populate('projectId');
    if (!file || file.projectId.agencyId.toString() !== req.agency._id.toString()) {
      throw new ApiError(404, 'File not found');
    }

    // Security: Clients can only approve files of their own projects
    if (req.user.role === 'client' && file.projectId.clientId.toString() !== req.user.id) {
      throw new ApiError(403, 'Forbidden: Insufficient permissions');
    }

    file.approved = true;
    file.approvedBy = req.user.id;
    file.approvedAt = new Date();
    await file.save();

    const populatedFile = await File.findById(file._id)
      .populate('uploadedBy', 'name role avatar')
      .populate('approvedBy', 'name role avatar');

    emitToProject(io, file.projectId._id.toString(), 'file_approved', {
      fileId: file._id,
      approvedBy: req.user.name,
    });

    res.json({
      success: true,
      file: populatedFile,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /:id — Delete file reference from DB and its physical asset from Cloudinary
router.delete('/:id', auth, tenancy, async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id).populate('projectId');
    if (!file || file.projectId.agencyId.toString() !== req.agency._id.toString()) {
      throw new ApiError(404, 'File not found');
    }

    // Security: Clients can only delete their own uploaded files, agencies can delete anything
    if (req.user.role === 'client' && file.uploadedBy.toString() !== req.user.id) {
      throw new ApiError(403, 'Forbidden: Insufficient permissions');
    }

    if (file.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(file.cloudinaryPublicId);
      } catch (cloudinaryErr) {
        console.error(`Failed to delete Cloudinary asset ${file.cloudinaryPublicId}:`, cloudinaryErr.message);
      }
    }

    await File.findByIdAndDelete(file._id);

    res.json({
      success: true,
      message: 'File deleted successfully from Cloudinary and database',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
