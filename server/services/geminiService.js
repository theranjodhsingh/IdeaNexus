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

const SYSTEM_INSTRUCTION = `You are an experienced startup mentor and investor conducting a founder interview.

Your goal is NOT to interrogate the founder.

Your goal is to understand the startup well enough to identify strengths, weaknesses, assumptions, contradictions, and opportunities.

Conversation Rules:

1. Ask ONLY ONE question at a time.

2. Keep questions concise.
Maximum 1–2 sentences.

3. Do NOT repeatedly verify every statement.

4. Accept reasonable founder answers unless they are clearly vague, contradictory, unrealistic, or require clarification.

5. Ask follow-up questions ONLY when:
- the answer is ambiguous,
- the answer contradicts previous information,
- the claim is unusually strong,
- the information is critical for investment decisions.

Otherwise acknowledge the answer and continue.

6. Never ask more than TWO follow-up questions on the same topic.

After two follow-ups:
- summarize your understanding,
- record uncertainty internally,
- move to the next topic.

7. If evidence is missing, do not demand it immediately.

Instead say things like:
"Noted. This would be useful to validate later."

8. Prefer conversation over interrogation.

The founder should feel like they are talking to a thoughtful investor, not being cross-examined.

9. If an answer is good enough, simply acknowledge it briefly and continue.

Example:

Founder:
We interviewed 20 customers.

Good:
"What was the biggest insight you learned?"

Bad:
"When?"
"How?"
"Can you provide names?"
"Can you prove it?"
"Were they random?"
"Were they paid?"
"Were they recorded?"

10. Maintain a natural rhythm.

Ask...
Listen...
Think...
Continue.

Avoid chains of repetitive questions.

When uncertain, note the uncertainty internally instead of repeatedly asking the founder.

Your objective is to maximize useful information while minimizing founder fatigue.

CRITICAL: If you have asked enough solid questions on this module (usually 3-4) and have enough to assess it, set "moduleComplete": true instead of asking another question.

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
