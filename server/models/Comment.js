import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
    },
    body: {
      type: String,
      required: [true, 'Comment body is required'],
    },
    type: {
      type: String,
      enum: ['comment', 'approval_request', 'approved', 'rejected'],
      default: 'comment',
    },
  },
  {
    timestamps: true,
  }
);

export const Comment = mongoose.model('Comment', CommentSchema);
