import { Router } from 'express';
import { z } from 'zod';
import { Project } from '../models/Project.js';
import { Comment } from '../models/Comment.js';
import { File } from '../models/File.js';
import { ApiError } from '../utils/apiError.js';
import { auth } from '../middleware/auth.js';
import { tenancy } from '../middleware/tenancy.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const statusUpdateSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});

// POST /status-update — Agency only. Generates client status update email using Gemini flash model
router.post('/status-update', auth, tenancy, requireRole('agency'), validate(statusUpdateSchema), async (req, res, next) => {
  try {
    const { projectId } = req.body;

    const project = await Project.findOne({ _id: projectId, agencyId: req.agency._id }).populate('clientId', 'name email');
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Retrieve the last 10 comments
    const comments = await Comment.find({ projectId: project._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('authorId', 'name role');

    // Retrieve all files (both approved and pending) for context
    const files = await File.find({ projectId: project._id })
      .populate('uploadedBy', 'name')
      .populate('approvedBy', 'name');

    // Build chronological or reversed comment listing
    const commentsContext = comments
      .reverse()
      .map((c) => `[${c.createdAt.toISOString()}] ${c.authorId.name} (${c.authorId.role}): ${c.body}`)
      .join('\n');

    const filesContext = files
      .map(
        (f) =>
          `- ${f.filename} (Uploaded by: ${f.uploadedBy?.name || 'N/A'}, Status: ${
            f.approved ? `Approved by ${f.approvedBy?.name || 'N/A'} at ${f.approvedAt?.toISOString()}` : 'Pending Approval'
          })`
      )
      .join('\n');

    const context = `
Project Title: ${project.title}
Description: ${project.description || 'N/A'}
Current Status: ${project.status}
Phases Status: ${project.phases.map((p, i) => `Phase ${i + 1}: ${p.name} (${p.done ? 'Done' : 'In Progress'})`).join(', ')}

Recent Activity (Last 10 comments):
${commentsContext || 'No recent comments.'}

Files and Approvals:
${filesContext || 'No files uploaded.'}
`;

    const prompt = `You are writing a professional project status update email for a web agency. Based on this project data: ${context}. Write a concise 3-paragraph email update for the client. Tone: professional but warm.`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new ApiError(500, 'GEMINI_API_KEY is not configured on the server');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new ApiError(response.status || 502, `Gemini API invocation failed: ${errText}`);
    }

    const responseData = await response.json();
    const draft = responseData.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate status update draft.';

    res.json({
      success: true,
      draft,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
