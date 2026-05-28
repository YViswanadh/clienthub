import { Router } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Agency } from '../models/Agency.js';
import { ApiError } from '../utils/apiError.js';
import { auth } from '../middleware/auth.js';
import { tenancy } from '../middleware/tenancy.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { sendEmail } from '../utils/sendEmail.js';

const router = Router();

const registerSchema = z.object({
  agencyName: z.string().min(1, 'Agency name is required'),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(20, 'Subdomain must be at most 20 characters')
    .regex(/^[a-z0-9]+$/, 'Subdomain must be lowercase alphanumeric'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
});

// POST /register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { agencyName, subdomain, email, password } = req.body;

    const existingAgency = await Agency.findOne({ subdomain: subdomain.toLowerCase() }).session(session);
    if (existingAgency) {
      throw new ApiError(400, 'Subdomain is already taken');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() }).session(session);
    if (existingUser) {
      throw new ApiError(400, 'Email is already registered');
    }

    const [agency] = await Agency.create(
      [
        {
          name: agencyName,
          subdomain: subdomain.toLowerCase(),
        },
      ],
      { session }
    );

    const [user] = await User.create(
      [
        {
          name: agencyName,
          email: email.toLowerCase(),
          password,
          role: 'agency',
          agencyId: agency._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Tokens
    const accessToken = jwt.sign(
      { id: user._id, name: user.name, role: user.role, agencyId: user.agencyId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        agencyId: user.agencyId,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});

// POST /login
router.post('/login', tenancy, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find User by email + agency subdomain (from tenancy middleware)
    const user = await User.findOne({
      email: email.toLowerCase(),
      agencyId: req.agency._id,
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Tokens
    const accessToken = jwt.sign(
      { id: user._id, name: user.name, role: user.role, agencyId: user.agencyId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Update user lastSeen
    user.lastSeen = new Date();
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        agencyId: user.agencyId,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const cookies = req.headers.cookie || '';
    const refreshToken = cookies
      .split(';')
      .find((c) => c.trim().startsWith('refreshToken='))
      ?.split('=')[1];

    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token is missing');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    const accessToken = jwt.sign(
      { id: user._id, name: user.name, role: user.role, agencyId: user.agencyId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      accessToken,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Refresh token is expired or invalid'));
    } else {
      next(error);
    }
  }
});

// POST /logout
router.post('/logout', async (req, res, next) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /invite (agency only, requireRole('agency'))
router.post('/invite', auth, tenancy, requireRole('agency'), validate(inviteSchema), async (req, res, next) => {
  try {
    const { email, name } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(400, 'User with this email is already registered');
    }

    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

    const clientUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: tempPassword,
      role: 'client',
      agencyId: req.agency._id,
    });

    const token = jwt.sign(
      { id: clientUser._id, invite: true },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteLink = `${clientUrl}/accept-invite?token=${token}`;

    await sendEmail({
      to: clientUser.email,
      subject: `Invitation to join ${req.agency.name} on ClientHub`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #534ab7;">Welcome to ClientHub</h2>
          <p>Hello ${name},</p>
          <p>You have been invited by <strong>${req.agency.name}</strong> to join their client portal.</p>
          <p>Click the button below to accept the invitation and set up your account details:</p>
          <div style="margin: 24px 0;">
            <a href="${inviteLink}" style="background-color: #534ab7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="color: #718096; font-size: 14px;">If the button above does not work, copy and paste this URL into your browser:</p>
          <p style="color: #718096; font-size: 14px; word-break: break-all;"><a href="${inviteLink}">${inviteLink}</a></p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #a0aec0; font-size: 12px;">This invitation is valid for 7 days.</p>
        </div>
      `,
    });

    res.status(201).json({
      success: true,
      message: 'Invitation email successfully sent to client',
      client: {
        id: clientUser._id,
        name: clientUser.name,
        email: clientUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
