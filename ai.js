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

module.exports = generateTasks;