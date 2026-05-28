import mongoose from 'mongoose';

const AgencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Agency name is required'],
    },
    subdomain: {
      type: String,
      required: [true, 'Subdomain is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    logo: {
      type: String,
    },
    brandColor: {
      type: String,
      default: '#534AB7',
    },
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    stripeCustomerId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Agency = mongoose.model('Agency', AgencySchema);
