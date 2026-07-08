const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['ai', 'founder'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: true,
    },
    module: {
      type: String,
      enum: [
        'problem_solution',
        'market_customer',
        'validation',
        'revenue',
        'team',
        'competition',
        'risk',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'skipped'],
      default: 'in_progress',
    },
    messages: [messageSchema],
    // Claims extracted from this session, populated as AI processes responses
    extractedClaimIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Claim',
      },
    ],
  },
  { timestamps: true }
);

// One session per startup per module — enforce at the schema level
interviewSessionSchema.index({ startup: 1, module: 1 }, { unique: true });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
