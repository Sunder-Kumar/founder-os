require("dotenv").config();
const axios = require("axios");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function generateTasks(idea, goal) {
  const prompt = `
Startup Idea: ${idea}
Goal: ${goal}

Generate 5 tasks needed to build the MVP.
Return them as a simple list.
`;

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "openrouter/auto",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const text = response.data.choices[0].message.content;

  const tasks = text
    .split("\n")
    .map((t) => t.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  return tasks;
}

async function generatePRD(idea, goal, research) {
  const prompt = `
Startup Idea: ${idea}
Goal: ${goal}
Market Research: ${research}

Generate a professional Product Requirements Document (PRD) for this startup.
Include the following sections:
1. Executive Summary
2. Target Audience
3. Problem Statement
4. Core Features (List 5 key features)
5. Suggested Tech Stack

Format the response as a JSON object with these keys: "summary", "audience", "problem", "features" (array), and "techStack" (string).
`;

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "openrouter/auto",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" }
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return JSON.parse(response.data.choices[0].message.content);
}

module.exports = { generateTasks, generatePRD };