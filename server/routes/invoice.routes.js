import { Router } from 'express';
import { z } from 'zod';
import { Invoice } from '../models/Invoice.js';
import { ApiError } from '../utils/apiError.js';
import { auth } from '../middleware/auth.js';
import { tenancy } from '../middleware/tenancy.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { generatePDF } from '../utils/generatePDF.js';
import { sendEmail } from '../utils/sendEmail.js';
import { stripe } from '../config/stripe.js';
import { io } from '../server.js';
import { emitToProject } from '../sockets/index.js';

const router = Router();

const invoiceCreateSchema = z.object({
  clientId: z.string().min(1, 'Client reference ID is required'),
  projectId: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1, 'Description is required'),
        amount: z.number().positive('Amount must be positive'),
      })
    )
    .min(1, 'At least one line item is required'),
  dueDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});

const invoiceUpdateSchema = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1),
        amount: z.number().positive(),
      })
    )
    .optional(),
  dueDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});

// Helper Webhook Handler (Raw body, no auth)
const handleStripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // In server.js, express.raw parses it as Buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Stripe webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoiceId;

    if (invoiceId) {
      const invoice = await Invoice.findById(invoiceId);
      if (invoice) {
        invoice.status = 'paid';
        invoice.stripePaymentId = session.payment_intent;
        invoice.paidAt = new Date();
        await invoice.save();

        if (invoice.projectId) {
          emitToProject(io, invoice.projectId.toString(), 'invoice_paid', invoice);
        }
      }
    }
  }

  res.json({ received: true });
};

// Helper Create Invoice Handler (Agency authorized, parsed JSON)
const createInvoice = async (req, res, next) => {
  try {
    const total = req.body.lineItems.reduce((sum, item) => sum + item.amount, 0);

    const newInvoice = await Invoice.create({
      ...req.body,
      total,
      agencyId: req.agency._id,
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      invoice: newInvoice,
    });
  } catch (error) {
    next(error);
  }
};

// POST / — Handles BOTH Stripe Webhook (unauthenticated, raw body) and Create Invoice (agency authenticated, JSON body)
router.post(
  '/',
  (req, res, next) => {
    if (req.originalUrl.startsWith('/api/webhooks/stripe')) {
      return handleStripeWebhook(req, res, next);
    }
    next();
  },
  tenancy,
  auth,
  requireRole('agency'),
  validate(invoiceCreateSchema),
  createInvoice
);

// GET / — List invoices, client-scoped automatically
router.get('/', auth, tenancy, async (req, res, next) => {
  try {
    const filter = { agencyId: req.agency._id };

    if (req.user.role === 'client') {
      filter.clientId = req.user.id;
    } else if (req.query.clientId) {
      filter.clientId = req.query.clientId;
    }

    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }

    const invoices = await Invoice.find(filter)
      .populate('clientId', 'name email avatar')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      invoices,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /:id — Update a draft invoice (agency only, status must be draft)
router.put('/:id', auth, tenancy, requireRole('agency'), validate(invoiceUpdateSchema), async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, agencyId: req.agency._id });
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    if (invoice.status !== 'draft') {
      throw new ApiError(400, 'Only draft invoices can be updated');
    }

    if (req.body.lineItems) {
      req.body.total = req.body.lineItems.reduce((sum, item) => sum + item.amount, 0);
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoice._id,
      { $set: req.body },
      { new: true }
    )
      .populate('clientId', 'name email')
      .populate('projectId', 'title');

    res.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error) {
    next(error);
  }
});

// POST /:id/send — Render PDF invoice, send email via Resend with attachment, and set status=sent (agency only)
router.post('/:id/send', auth, tenancy, requireRole('agency'), async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, agencyId: req.agency._id })
      .populate('clientId', 'name email')
      .populate('projectId', 'title');

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    // Attach agencyName dynamics for PDF header
    invoice.agencyName = req.agency.name;

    const pdfBuffer = await generatePDF(invoice);

    await sendEmail({
      to: invoice.clientId.email,
      subject: `Invoice #${invoice._id} from ${req.agency.name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #534ab7; margin-bottom: 16px;">New Invoice Received</h2>
          <p>Hello ${invoice.clientId.name},</p>
          <p>You have received a new invoice from <strong>${req.agency.name}</strong>.</p>
          <p style="font-size: 16px; margin: 16px 0;"><strong>Total Amount Due:</strong> <span style="color: #534ab7; font-weight: bold;">$${invoice.total.toFixed(2)}</span></p>
          <p>Please find the official PDF invoice attached to this email. You can pay this invoice by logging into your client portal.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #a0aec0; font-size: 12px;">Thank you for partnering with us!</p>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${invoice._id}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    invoice.status = 'sent';
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice sent successfully',
      invoice,
    });
  } catch (error) {
    next(error);
  }
});

// POST /:id/checkout — Create Stripe Checkout session for invoice payment
router.post('/:id/checkout', auth, tenancy, async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, agencyId: req.agency._id });
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    const line_items = invoice.lineItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.description,
        },
        unit_amount: Math.round(item.amount * 100), // In cents
      },
      quantity: 1,
    }));

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      metadata: {
        invoiceId: invoice._id.toString(),
      },
      success_url: `${clientUrl}/invoices?success=true&invoiceId=${invoice._id}`,
      cancel_url: `${clientUrl}/invoices?cancel=true`,
    });

    invoice.stripeCheckoutId = session.id;
    await invoice.save();

    res.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
