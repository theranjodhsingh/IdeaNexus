const express = require('express');

const mongoose = require('mongoose');

const Startup = require('../models/Startup');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Ownership check — returns the startup if it exists AND belongs to the current user.
// Otherwise sends the appropriate error response and returns null.
const findOwnedStartup = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: 'Invalid startup id' });
    return null;
  }

  const startup = await Startup.findById(id);

  if (!startup) {
    res.status(404).json({ success: false, message: 'Startup not found' });
    return null;
  }

  if (startup.founder.toString() !== req.user._id.toString()) {
    res.status(403).json({ success: false, message: 'Not authorized to access this startup' });
    return null;
  }

  return startup;
};

router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, industry, stage, fundingNeeded, fundingRaised, useOfFunds } = req.body;

    if (!name || !industry || !stage) {
      return res.status(400).json({
        success: false,
        message: 'Name, industry, and stage are required',
      });
    }

    const startup = await Startup.create({
      name,
      description,
      industry,
      stage,
      fundingNeeded,
      fundingRaised,
      useOfFunds,
      founder: req.user._id,
    });

    return res.status(201).json({
      success: true,
      data: { startup },
    });
  } catch (error) {
    console.error('CREATE STARTUP ERROR:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to create startup' });
  }
});

// GET /api/startups — list all startups owned by the current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const startups = await Startup.find({ founder: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: startups.length,
      data: { startups },
    });
  } catch (error) {
    console.error('LIST STARTUPS ERROR:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch startups' });
  }
});

// GET /api/startups/:id — fetch a single startup (founder only)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const startup = await findOwnedStartup(req, res);
    if (!startup) return;

    return res.status(200).json({ success: true, data: { startup } });
  } catch (error) {
    console.error('GET STARTUP ERROR:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch startup' });
  }
});

// PUT /api/startups/:id — update a startup (founder only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid startup id' });
    }

    const startup = await Startup.findById(id);

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' });
    }

    if (startup.founder.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this startup' });
    }
    
    // Only allow editing user-provided fields. founder / interviewStatus /
    // currentModule are system-managed and must not be changed via this endpoint.
    const editable = ['name', 'description', 'industry', 'stage', 'fundingNeeded', 'fundingRaised', 'useOfFunds'];

    for (const field of editable) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        startup[field] = req.body[field];
      }
    }

    await startup.save();

    return res.status(200).json({ success: true, data: { startup } });
  } catch (error) {
    console.error('UPDATE STARTUP ERROR:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Failed to update startup' });
  }
});

// DELETE /api/startups/:id — delete a startup (founder only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid startup id' });
    }

    const startup = await Startup.findById(id);

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' });
    }

    if (startup.founder.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this startup' });
    }

    await startup.deleteOne();

    return res.status(200).json({ success: true, message: 'Startup deleted' });
  } catch (error) {
    console.error('DELETE STARTUP ERROR:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete startup' });
  }
});

module.exports = router;
