const express = require('express');

const ReadinessReport = require('../models/ReadinessReport');
const Startup = require('../models/Startup');
const InterviewSession = require('../models/InterviewSession');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

const CATEGORY_KEYS = [
  'marketValidation',
  'teamStrength',
  'financialClarity',
  'competitiveAnalysis',
  'productReadiness',
];

function clampScore(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function buildFallbackReport({ startup, interviewSession, userId }) {
  const messages = (interviewSession?.messages || []).filter((message) => message?.content);
  const text = messages.map((message) => message.content).join('\n');
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const heuristicScore = Math.min(95, 42 + Math.min(wordCount, 40) * 1.2);
  const categoryScores = {
    marketValidation: clampScore(heuristicScore - 6),
    teamStrength: clampScore(heuristicScore - 3),
    financialClarity: clampScore(heuristicScore - 8),
    competitiveAnalysis: clampScore(heuristicScore - 4),
    productReadiness: clampScore(heuristicScore - 2),
  };

  const overallScore = Math.round(
    (categoryScores.marketValidation + categoryScores.teamStrength + categoryScores.financialClarity + categoryScores.competitiveAnalysis + categoryScores.productReadiness) / 5
  );

  const redFlags = [];
  if (categoryScores.financialClarity < 55) redFlags.push('Financial clarity is still immature');
  if (categoryScores.competitiveAnalysis < 55) redFlags.push('Competitive moat is not yet clear');
  if (categoryScores.productReadiness < 55) redFlags.push('Product readiness needs stronger evidence');
  if (!startup?.description) redFlags.push('The idea narrative needs more definition');
  if (wordCount < 80) redFlags.push('Interview evidence is still light');

  return {
    userId,
    startupId: startup?._id || null,
    ideaId: null,
    overallScore,
    categoryScores,
    redFlags,
    summary: `This report reflects the interview evidence gathered so far for ${startup?.name || 'this startup'}. The strongest signals are around product clarity and market positioning, while financial and competitive depth remain the most important levers to strengthen before fundraising.`,
    interviewVersion: 1,
  };
}

router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { startupId, interviewSessionId, interviewData } = req.body;

    if (!startupId && !interviewSessionId) {
      return res.status(400).json({
        success: false,
        message: 'startupId or interviewSessionId is required',
      });
    }

    let startup = null;
    let interviewSession = null;

    if (startupId) {
      startup = await Startup.findById(startupId);
      if (!startup) {
        return res.status(404).json({ success: false, message: 'Startup not found' });
      }
      if (startup.founder.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'You do not have access to this startup' });
      }
    }

    if (interviewSessionId) {
      interviewSession = await InterviewSession.findById(interviewSessionId);
      if (!interviewSession) {
        return res.status(404).json({ success: false, message: 'Interview session not found' });
      }
      if (!startup) {
        startup = await Startup.findById(interviewSession.startup);
      }
      if (startup && startup.founder.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'You do not have access to this interview session' });
      }
    }

    const payload = interviewData || {};
    const submittedCategoryScores = payload.categoryScores || {};

    const categoryScores = Object.fromEntries(
      CATEGORY_KEYS.map((key) => [key, clampScore(submittedCategoryScores[key] ?? 0)])
    );

    const overallScore = clampScore(
      payload.overallScore ?? Object.values(categoryScores).reduce((total, value) => total + value, 0) / CATEGORY_KEYS.length
    );

    const redFlags = Array.isArray(payload.redFlags)
      ? payload.redFlags.filter((item) => typeof item === 'string' && item.trim())
      : [];

    const summary = typeof payload.summary === 'string' && payload.summary.trim()
      ? payload.summary.trim()
      : `The interview evidence points to a ${overallScore >= 70 ? 'promising' : overallScore >= 50 ? 'developing' : 'high-risk'} investment profile with clear areas to strengthen.`;

    const report = await ReadinessReport.findOneAndUpdate(
      {
        userId: req.user._id,
        startupId: startup?._id || null,
      },
      {
        userId: req.user._id,
        startupId: startup?._id || null,
        ideaId: payload.ideaId || null,
        overallScore,
        categoryScores,
        redFlags,
        summary,
        interviewVersion: 1,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(201).json({ success: true, data: { report } });
  } catch (error) {
    console.error('GENERATE REPORT ERROR:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate readiness report' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const report = await ReadinessReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Readiness report not found' });
    }

    if (report.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have access to this report' });
    }

    return res.json({ success: true, data: { report } });
  } catch (error) {
    console.error('GET REPORT ERROR:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch readiness report' });
  }
});

router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have access to these reports' });
    }

    const reports = await ReadinessReport.find({ userId: req.params.userId }).sort({ createdAt: -1 });

    return res.json({ success: true, data: { reports } });
  } catch (error) {
    console.error('GET USER REPORTS ERROR:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch readiness reports' });
  }
});

module.exports = router;
