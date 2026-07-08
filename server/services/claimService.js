/**
 * Claim service — Phase 4 stub.
 *
 * Owns the lifecycle of a Claim after it has been extracted from an
 * interview turn: persistence, supersession, cross-module references,
 * and (later) the validation pipeline that runs before a claim is
 * considered "evidence-backed" vs. "founder_claimed".
 *
 * In Phase 2 / Phase 3 the only claim creation path is the one inside
 * interviewService.sendMessage — this file is the seam where Phase 4
 * logic (rule application, claim merging, finding generation) will land.
 */

module.exports = {};
