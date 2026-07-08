/**
 * Static definition of the 7 interview modules.
 *
 * Each module has:
 *   - key: the enum value stored on Startup.currentModule and InterviewSession.module
 *   - focus: the directive sent to Gemini so it knows what angle to push
 *   - questions: the seeded question bank. The interviewer iterates through
 *     these in order on the very first pass. Once a module's questions are
 *     exhausted OR the AI decides the founder has said enough (moduleComplete),
 *     the session for that module ends and the startup advances to the next.
 *
 * In Phase 2 we only ship hardcoded questions for problem_solution so the
 * architecture is provable end-to-end. Phase 3 lets Gemini generate the
 * questions dynamically using the focus string + the conversation so far.
 *
 * Why hardcoded first:
 *   - Proves the session/message/claim persistence without any AI dependency.
 *   - Forces the question bank shape to be real, so swapping Gemini in later
 *     is a one-file change in geminiService.js.
 *   - Gives us deterministic test data for the rules engine in Phase 4.
 */

const MODULES = {
  problem_solution: {
    key: 'problem_solution',
    label: 'Problem & Solution',
    focus:
      'Probe what specific problem this startup solves and why the proposed solution actually addresses it. Push back on vague problem statements. Demand a concrete, named user pain — not a market category.',
    questions: [
      'In one sentence, what specific problem are you solving and for whom?',
      'How do you know this is a real problem — what evidence do you have that people actually experience it today?',
      'Walk me through your solution. Why does this approach fit the problem better than the obvious alternatives?',
      'What is the simplest thing that already exists that your customers could use instead, and why would they switch to you?',
      'If you could only keep one piece of validation evidence — an interview, a waitlist signup, a usage log — which would it be and why?',
    ],
  },

  market_customer: {
    key: 'market_customer',
    label: 'Market & Customer',
    focus:
      'Probe who the actual first customers are and why they would buy. Reject abstract TAM numbers. If a market size is cited, ask for the source and the founder\'s own calculation, not a third-party report.',
    questions: [],
  },

  validation: {
    key: 'validation',
    label: 'Validation',
    focus:
      'Probe for evidence of real customer validation — retention, repeat usage, customer interviews. Distinguish founder belief from founder evidence.',
    questions: [],
  },

  revenue: {
    key: 'revenue',
    label: 'Revenue',
    focus:
      'Probe revenue MODEL (how they intend to make money) and ACTUAL revenue (money that has changed hands) as separate things. Do not let them blur together.',
    questions: [],
  },

  team: {
    key: 'team',
    label: 'Team',
    focus:
      'Probe relevant track record — has this team built or sold something before, does anyone have direct experience in this specific problem space.',
    questions: [],
  },

  competition: {
    key: 'competition',
    label: 'Competition',
    focus:
      'Probe who the real competitors are and why customers would switch. A founder claiming "no competitors" is a red flag — push on this directly.',
    questions: [],
  },

  risk: {
    key: 'risk',
    label: 'Risk',
    focus:
      'Probe what the founder believes is most likely to kill this business, and whether their mitigation plan is real or hand-wavy.',
    questions: [],
  },
};

// Order in which modules are run for a startup. The startup.currentModule
// advances through this list as each session completes.
const MODULE_ORDER = [
  'problem_solution',
  'market_customer',
  'validation',
  'revenue',
  'team',
  'competition',
  'risk',
];

const getModule = (key) => MODULES[key] || null;

const getNextModuleKey = (currentKey) => {
  const index = MODULE_ORDER.indexOf(currentKey);
  if (index === -1 || index === MODULE_ORDER.length - 1) {
    return null; // no next module — interview is fully done
  }
  return MODULE_ORDER[index + 1];
};

module.exports = {
  MODULES,
  MODULE_ORDER,
  getModule,
  getNextModuleKey,
};
