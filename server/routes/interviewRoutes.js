/**
 * /api/interview — thin HTTP layer over interviewService.
 *
 * Each handler does exactly three things:
 *   1. Parse and lightly validate the request.
 *   2. Call interviewService.
 *   3. Map the result (or a typed error) to a status code and JSON body.
 *
 * No business logic, no AI calls, no DB calls live in this file. That
 * separation is the whole point of the services/ split.
 */

const express = require('express');

const interviewService = require('../services/interviewService');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/interview/start — start (or resume) the session for the
// startup's current module.
router.post('/start', verifyToken, async (req, res) => {
  try {
    const { startupId } = req.body;

    if (!startupId) {
      return res.status(400).json({
        success: false,
        message: 'startupId is required',
      });
    }

    const { session } = await interviewService.startSession(req.user._id, startupId);

    return res.status(200).json({
      success: true,
      data: { session },
    });
  } catch (error) {
    console.error('START INTERVIEW ERROR:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to start interview session',
    });
  }
});

// POST /api/interview/:sessionId/message — send the founder's reply,
// receive the AI's next turn (and possibly a Claim) back.
router.post('/:sessionId/message', verifyToken, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    const { session, moduleComplete, extractedClaim } = await interviewService.sendMessage(
      req.user._id,
      req.params.sessionId,
      content
    );

    return res.status(200).json({
      success: true,
      data: { session, moduleComplete, extractedClaim },
    });
  } catch (error) {
    console.error('SEND MESSAGE ERROR:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to send message',
    });
  }
});

// GET /api/interview/:sessionId — fetch a session by id (founder-scoped).
router.get('/:sessionId', verifyToken, async (req, res) => {
  try {
    // The simplest read path: startSession will reuse an existing session
    // if we pass it through. For a single read we just call sendMessage's
    // ownership check indirectly — instead, expose a tiny lookup that
    // shares loadOwnedStartup's behavior.
    const session = await interviewService.getSession(
      req.user._id,
      req.params.sessionId
    );

    return res.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    console.error('GET INTERVIEW ERROR:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch interview session',
    });
  }
});

module.exports = router;
