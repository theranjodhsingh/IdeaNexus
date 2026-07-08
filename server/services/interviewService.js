/**
 * Interview service — Phase 2 / 3.
 *
 * Owns the state machine of an interview session:
 *   1. startSession()      — seats the founder at the first question of the
 *                            startup's current module. If the module has a
 *                            hardcoded question bank we use it; if not, we
 *                            ask Gemini for the first question.
 *   2. sendMessage()       — persists the founder's reply, calls Gemini for
 *                            the next turn, persists the AI response, and
 *                            writes a Claim document if one was extracted.
 *                            Marks the session complete when Gemini says so.
 *
 * No HTTP concerns live here — routes just call these two functions and
 * return whatever they get. All persistence and AI coordination is in
 * this file so the route handler stays a one-liner.
 *
 * Why hardcoded-first for problem_solution: the question bank is real,
 * the persistence is real, the claim extraction is real. The only thing
 * that changes in Phase 3 is the source of the next question string.
 */

const Startup = require('../models/Startup');
const InterviewSession = require('../models/InterviewSession');
const Claim = require('../models/Claim');
const { getModule, getNextModuleKey } = require('../utils/interviewModules');
const geminiService = require('./geminiService');

/**
 * Returns the startup if it exists and belongs to this user, otherwise
 * throws a typed error the route can map to a status code.
 */
const loadOwnedStartup = async (startupId, userId) => {
  const startup = await Startup.findById(startupId);

  if (!startup) {
    const error = new Error('Startup not found');
    error.status = 404;
    throw error;
  }

  if (startup.founder.toString() !== userId.toString()) {
    const error = new Error('You do not have access to this startup');
    error.status = 403;
    throw error;
  }

  return startup;
};

/**
 * If the module has a hardcoded question bank, return the first one
 * that hasn't been asked yet (we use message count to find our position).
 * Returns null if the bank is exhausted or empty — callers should then
 * ask Gemini for the first question.
 */
const pickHardcodedQuestion = (moduleDef, askedCount) => {
  if (!moduleDef.questions || moduleDef.questions.length === 0) {
    return null;
  }
  if (askedCount >= moduleDef.questions.length) {
    return null;
  }
  return moduleDef.questions[askedCount];
};

/**
 * Starts (or resumes) an interview session for a startup at its current
 * module. If a session for that module doesn't exist yet, creates one and
 * seats the founder at the first question. If one already exists, just
 * returns it.
 */
const startSession = async (userId, startupId) => {
  const startup = await loadOwnedStartup(startupId, userId);

  if (startup.interviewStatus === 'completed') {
    const error = new Error('Interview already completed for this startup');
    error.status = 400;
    throw error;
  }

  if (!startup.currentModule) {
    const error = new Error('Startup has no current module — interview is done');
    error.status = 400;
    throw error;
  }

  const moduleDef = getModule(startup.currentModule);
  if (!moduleDef) {
    const error = new Error(`Unknown module on startup: ${startup.currentModule}`);
    error.status = 500;
    throw error;
  }

  // Reuse the existing session for this module if one already exists.
  let session = await InterviewSession.findOne({
    startup: startup._id,
    module: startup.currentModule,
  });

  if (session) {
    return { startup, session };
  }

  // New session — seat the founder at the first question.
  const hardcodedQ = pickHardcodedQuestion(moduleDef, 0);

  let firstQuestion = hardcodedQ;
  if (!firstQuestion) {
    // Module has no hardcoded bank — ask Gemini for the first question.
    // moduleComplete cannot be true on a fresh session, so question is set.
    const aiTurn = await geminiService.getNextInterviewTurn({
      module: moduleDef.key,
      moduleFocus: moduleDef.focus,
      messages: [],
    });
    firstQuestion = aiTurn.question;
  }

  try {
    session = await InterviewSession.create({
      startup: startup._id,
      module: startup.currentModule,
      status: 'in_progress',
      messages: [{ role: 'ai', content: firstQuestion }],
    });
  } catch (error) {
    // Handle race condition (e.g. React StrictMode double mount) where another request 
    // just created this session a few milliseconds ago
    if (error.code === 11000) {
      session = await InterviewSession.findOne({
        startup: startup._id,
        module: startup.currentModule,
      });
      if (!session) throw error;
    } else {
      throw error;
    }
  }

  if (startup.interviewStatus === 'not_started') {
    startup.interviewStatus = 'in_progress';
    await startup.save();
  }

  return { startup, session };
};

/**
 * Persists the founder's reply, calls Gemini for the next turn, persists
 * the AI response, and creates a Claim document if one was extracted.
 * Returns the updated session, the AI turn metadata, and the created claim
 * (if any). Throws on AI failures — caller (route) should NOT swallow,
 * because a silent failure here means a claim quietly never gets recorded.
 */
const sendMessage = async (userId, sessionId, content) => {
  const session = await InterviewSession.findById(sessionId);
  if (!session) {
    const error = new Error('Interview session not found');
    error.status = 404;
    throw error;
  }

  const startup = await loadOwnedStartup(session.startup, userId);

  if (session.status === 'completed') {
    const error = new Error('This interview module is already completed');
    error.status = 400;
    throw error;
  }

  // Persist the founder's message FIRST. Even if Gemini fails below, the
  // founder's reply is durable. This is the only persistence ordering
  // that respects the user.
  session.messages.push({ role: 'founder', content: content.trim() });
  await session.save();

  const moduleDef = getModule(session.module);
  if (!moduleDef) {
    const error = new Error(`Session has unknown module: ${session.module}`);
    error.status = 500;
    throw error;
  }

  // Count the AI questions already in the conversation. We use this to
  // know whether to serve a hardcoded question or call Gemini.
  const aiQuestionCount = session.messages.filter((m) => m.role === 'ai').length;
  const hardcodedQ = pickHardcodedQuestion(moduleDef, aiQuestionCount);

  let aiTurn;

  if (hardcodedQ) {
    // Module has a seeded question bank and we haven't exhausted it —
    // serve the next hardcoded question. No claim extraction on hardcoded
    // questions; claims are an AI extraction artifact.
    aiTurn = {
      question: hardcodedQ,
      moduleComplete: false,
      extractedClaim: null,
    };
  } else {
    // Module has no hardcoded bank (or it's exhausted) — ask Gemini.
    aiTurn = await geminiService.getNextInterviewTurn({
      module: moduleDef.key,
      moduleFocus: moduleDef.focus,
      messages: session.messages,
    });
  }

  // Persist whatever the AI produced.
  if (aiTurn.moduleComplete) {
    session.status = 'completed';

    // Advance the startup to the next module, if any.
    const nextKey = getNextModuleKey(session.module);
    startup.currentModule = nextKey;
    if (!nextKey) {
      startup.interviewStatus = 'completed';
    }
    await startup.save();
  } else if (aiTurn.question) {
    session.messages.push({ role: 'ai', content: aiTurn.question });
  }

  // Extract the claim as its own Claim document, NEVER inline on the
  // message. This is the claims-are-permanent architecture rule.
  let createdClaim = null;
  if (aiTurn.extractedClaim) {
    createdClaim = await Claim.create({
      startup: startup._id,
      interviewSession: session._id,
      module: session.module,
      category: aiTurn.extractedClaim.category,
      rawStatement: aiTurn.extractedClaim.rawStatement,
      value: aiTurn.extractedClaim.value,
      valueType: aiTurn.extractedClaim.valueType,
      asOfDate: aiTurn.extractedClaim.asOfDate || null,
      status: 'founder_claimed',
    });

    session.extractedClaimIds.push(createdClaim._id);
  }

  await session.save();

  return { session, moduleComplete: aiTurn.moduleComplete, extractedClaim: createdClaim };
};

/**
 * Read-only lookup: returns the session if it exists and belongs to the
 * calling user. Used by the GET /:sessionId route.
 */
const getSession = async (userId, sessionId) => {
  const session = await InterviewSession.findById(sessionId);

  if (!session) {
    const error = new Error('Interview session not found');
    error.status = 404;
    throw error;
  }

  await loadOwnedStartup(session.startup, userId);
  return session;
};

module.exports = {
  startSession,
  sendMessage,
  getSession,
};
