const mongoose = require('mongoose');

const startupSchema = new mongoose.Schema(
  {
    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },
    industry: {
      type: String,
      required: true,
    },
    stage: {
      type: String,
      enum: ['idea', 'pre_revenue', 'early_revenue', 'scaling'],
      required: true,
    },
    // Structured fields, not interrogated by AI — per Funding decision
    fundingNeeded: {
      type: Number,
      default: null,
    },
    fundingRaised: {
      type: Number,
      default: 0,
    },
    useOfFunds: {
      type: String,
      default: null,
    },
    interviewStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    currentModule: {
      type: String,
      enum: [
        'problem_solution',
        'market_customer',
        'validation',
        'revenue',
        'team',
        'competition',
        'risk',
        null,
      ],
      default: 'problem_solution',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Startup', startupSchema);