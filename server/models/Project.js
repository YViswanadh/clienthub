import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      required: [true, 'Agency reference is required'],
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'review', 'done'],
      default: 'active',
    },
    dueDate: {
      type: Date,
    },
    budget: {
      type: Number,
    },
    phases: [
      {
        name: {
          type: String,
          required: true,
        },
        done: {
          type: Boolean,
          default: false,
        },
      },
    ],
    tags: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for optimal querying by agency and project status
ProjectSchema.index({ agencyId: 1, status: 1 });

export const Project = mongoose.model('Project', ProjectSchema);
