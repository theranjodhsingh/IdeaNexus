const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: true,
    },
    interviewSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSession',
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
    // Specific claim category within the module
    // e.g. 'problem_statement', 'paying_customers', 'revenue_actual', 'revenue_model_type'
    category: {
      type: String,
      required: true,
    },
    // What the founder actually said, verbatim or lightly cleaned
    rawStatement: {
      type: String,
      required: true,
    },
    // Normalized value AI extracts — shape depends on category type
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    valueType: {
      type: String,
      enum: ['text', 'number', 'list', 'boolean'],
      required: true,
    },
    // For numeric claims that can drift over time (customers, revenue)
    // null for claims where time isn't relevant (problem statement, competitor names)
    asOfDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['founder_claimed', 'not_provided'],
      default: 'founder_claimed',
    },
    // Cross-module intelligence — what earlier claims this answer relates to or was prompted by
    referencedClaimIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Claim',
      },
    ],
    // Append-only versioning — never mutate, only supersede
    supersedesClaimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim',
      default: null,
    },
    isCurrent: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

claimSchema.index({ startup: 1, module: 1, category: 1 });
claimSchema.index({ startup: 1, isCurrent: 1 });

module.exports = mongoose.model('Claim', claimSchema);
