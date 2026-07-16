const mongoose = require('mongoose');

const readinessReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      default: null,
      index: true,
    },
    ideaId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    categoryScores: {
      marketValidation: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      teamStrength: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      financialClarity: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      competitiveAnalysis: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      productReadiness: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },
    redFlags: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      default: '',
    },
    interviewVersion: {
      type: Number,
      default: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ReadinessReport', readinessReportSchema);
