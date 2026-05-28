import { Router } from 'express';
import { z } from 'zod';
import { Agency } from '../models/Agency.js';
import { User } from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { tenancy } from '../middleware/tenancy.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';

const router = Router();

const agencyUpdateSchema = z.object({
  name: z.string().min(1, 'Name must be at least 1 character').optional(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color code (e.g. #534AB7)').optional(),
});

// GET / — Return req.agency details
router.get('/', auth, tenancy, async (req, res, next) => {
  try {
    const { name, subdomain, logo, brandColor, plan } = req.agency;
    res.json({
      success: true,
      agency: { name, subdomain, logo, brandColor, plan },
    });
  } catch (error) {
    next(error);
  }
});

// PUT / — Update agency profile, logo upload via Cloudinary
router.put(
  '/',
  auth,
  tenancy,
  requireRole('agency'),
  upload.single('logo'),
  validate(agencyUpdateSchema),
  async (req, res, next) => {
    try {
      const updateData = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.brandColor !== undefined) updateData.brandColor = req.body.brandColor;

      if (req.file) {
        updateData.logo = req.file.path; // Secure Cloudinary URL is in req.file.path
      }

      const updatedAgency = await Agency.findByIdAndUpdate(
        req.agency._id,
        { $set: updateData },
        { new: true }
      );

      res.json({
        success: true,
        agency: {
          name: updatedAgency.name,
          subdomain: updatedAgency.subdomain,
          logo: updatedAgency.logo,
          brandColor: updatedAgency.brandColor,
          plan: updatedAgency.plan,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /clients — List all users with role: client for this agency
router.get('/clients', auth, tenancy, async (req, res, next) => {
  try {
    const clients = await User.find({
      role: 'client',
      agencyId: req.agency._id,
    }).select('-password');

    res.json({
      success: true,
      clients,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
