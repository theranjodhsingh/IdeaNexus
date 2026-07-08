/**
 * Thin wrapper around the Google Gemini SDK.
 *
 * This module is the ONLY place that talks to the AI provider. The rest of
 * the codebase treats it as a pure function:
 *
 *   getNextInterviewTurn({ module, moduleFocus, messages })
 *     -> { question, moduleComplete, extractedClaim }
 *
 * Anything AI-shaped (prompt construction, response parsing, error handling
 * for malformed outputs) lives here. If we swap providers later — or move
 * to a local model, or add a fallback — only this file changes.
 *
 * Throws on:
 *   - Missing API key
 *   - Malformed AI output (bad JSON, missing required fields)
 *   - Network / SDK errors
 *
 * Callers (interviewService) must catch and decide what to do — a thrown
 * error here means a claim quietly never got recorded, so callers should
 * surface it to the founder rather than swallow it.
 */

const { GoogleGenAI } = require('@google/genai');

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const SYSTEM_INSTRUCTION = `You are Nexus, an AI investigator conducting startup due-diligence interviews. You are NOT a cheerleader, NOT a chatbot, and NOT here to validate the founder's beliefs.

Your behavior:
- Demand evidence, not opinions. "We have product-market fit" is not an answer — what evidence supports that?
- Challenge vague or unsupported claims directly but respectfully.
- Never praise, never predict investment outcomes, never tell the founder their idea is good or bad.
- Ask ONE focused follow-up question at a time. Do not ask multiple questions in one turn.
- If the founder gives a strong, evidence-backed answer, acknowledge it briefly and move to the next angle — don't keep grilling something already well-supported.
- If you have asked 3-4 solid questions on this module and have enough to assess it, set "moduleComplete": true instead of asking another question.

You must respond with ONLY valid JSON, no markdown formatting, no backticks, matching this exact shape:
{
  "question": "your next question to the founder, or null if moduleComplete is true",
  "moduleComplete": boolean,
  "extractedClaim": {
    "category": "short_snake_case_category",
    "rawStatement": "the founder's claim in their own words, lightly cleaned",
    "value": "normalized value — a string, number, or array depending on the claim",
    "valueType": "text" | "number" | "list" | "boolean",
    "asOfDate": "ISO date string if the founder referenced a specific timeframe, otherwise null"
  } | null
}

Only include extractedClaim if the founder's most recent message actually contained a concrete, claimable statement (a fact, number, or assertion about their business). If they asked a question back, gave a greeting, or said something with no claimable content, set extractedClaim to null.`;

const buildPrompt = ({ moduleFocus, messages }) => {
  const conversationText = messages
    .map((m) => `${m.role === 'ai' ? 'Nexus' : 'Founder'}: ${m.content}`)
    .join('\n');

  return `Module focus: ${moduleFocus}

Conversation so far:
${conversationText || '(interview just started, no messages yet)'}

Respond with the JSON structure described in your instructions, based on the founder's most recent message.`;
};

const parseResponse = (rawText) => {
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (parseError) {
    throw new Error(`AI returned invalid JSON: ${rawText}`);
  }

  if (typeof parsed.moduleComplete !== 'boolean') {
    throw new Error(`AI response missing required moduleComplete field: ${rawText}`);
  }

  return parsed;
};

/**
 * Calls Gemini and returns the parsed interview turn.
 *
 * @param {Object} params
 * @param {string} params.module         - module key (e.g. 'problem_solution')
 * @param {string} params.moduleFocus    - the focus directive for this module
 * @param {Array<{role: string, content: string}>} params.messages - full chat so far
 * @returns {Promise<{question: string|null, moduleComplete: boolean, extractedClaim: object|null}>}
 */
async function getNextInterviewTurn({ module, moduleFocus, messages }) {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  if (!moduleFocus) {
    throw new Error(`Module focus is required to call Gemini (module: ${module})`);
  }

  const prompt = buildPrompt({ moduleFocus, messages });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
    },
  });

  return parseResponse(response.text);
}

module.exports = {
  getNextInterviewTurn,
};
