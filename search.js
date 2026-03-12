const axios = require("axios");
require("dotenv").config({ quiet: true });

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

/**
 * Searches the web for competitors and market trends.
 */
async function searchMarket(query) {
  if (!TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is missing in .env");
  }

  try {
    const response = await axios.post("https://api.tavily.com/search", {
      api_key: TAVILY_API_KEY,
      query: `top competitors and market trends for: ${query}`,
      search_depth: "advanced",
      include_answer: true,
      max_results: 5,
    });

    return {
      answer: response.data.answer,
      results: response.data.results.map(r => ({
        title: r.title,
        url: r.url,
        content: r.content
      }))
    };
  } catch (error) {
    console.error("Search API Error:", error.response?.data || error.message);
    throw new Error("Failed to perform web search.");
  }
}

module.exports = searchMarket;