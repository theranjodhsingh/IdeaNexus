/**
 * Client-side mirror of the 7-module interview order.
 *
 * The server is the source of truth — this list only describes the order
 * and a short label/description per module for UI rendering. Module keys
 * here MUST match the server's MODULE_ORDER in utils/interviewModules.js.
 */

export const MODULE_ORDER = [
  'problem_solution',
  'market_customer',
  'validation',
  'revenue',
  'team',
  'competition',
  'risk',
];

export const MODULE_META = {
  problem_solution: {
    key: 'problem_solution',
    label: 'Problem & Solution',
    description:
      'Clarify the pain point, the customer, and why the solution is the right fit.',
  },
  market_customer: {
    key: 'market_customer',
    label: 'Market & Customer',
    description:
      'Validate the target audience, the buyer, and your go-to-market focus.',
  },
  validation: {
    key: 'validation',
    label: 'Validation',
    description:
      'Surface evidence from interviews, usage, or early customer feedback.',
  },
  revenue: {
    key: 'revenue',
    label: 'Revenue',
    description:
      'Separate the revenue model from actual money that has changed hands.',
  },
  team: {
    key: 'team',
    label: 'Team',
    description:
      'Assess relevant track record, capabilities, and execution strength.',
  },
  competition: {
    key: 'competition',
    label: 'Competition',
    description:
      'Probe the true alternatives and the founder\'s switching thesis.',
  },
  risk: {
    key: 'risk',
    label: 'Key Risk',
    description:
      'Identify the most likely failure modes and the mitigation plan.',
  },
};

export function moduleLabel(key) {
  return MODULE_META[key]?.label || key || 'Interview';
}

export function moduleDescription(key) {
  return MODULE_META[key]?.description || '';
}

export const STAGE_OPTIONS = [
  { value: 'idea', label: 'Idea' },
  { value: 'pre_revenue', label: 'Pre Revenue' },
  { value: 'early_revenue', label: 'Early Revenue' },
  { value: 'scaling', label: 'Scaling' },
];

export function stageLabel(value) {
  return STAGE_OPTIONS.find((s) => s.value === value)?.label || value || '—';
}

export const INTERVIEW_STATUS_META = {
  not_started: { label: 'Not started', className: 'nexus-status-not_started' },
  in_progress: { label: 'In progress', className: 'nexus-status-in_progress' },
  completed: { label: 'Completed', className: 'nexus-status-completed' },
};

export function interviewStatusLabel(value) {
  return INTERVIEW_STATUS_META[value]?.label || 'Not started';
}
