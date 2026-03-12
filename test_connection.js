require("dotenv").config();
const notion = require("./notion");
const generateTasks = require("./ai");

async function testConnection() {
  console.log("--- Testing Connections ---");

  // 1. Test AI
  try {
    console.log("Testing AI (OpenRouter)...");
    const tasks = await generateTasks("Test Idea", "Test Goal");
    console.log("✅ AI Response received. Generated tasks:", tasks.length);
  } catch (error) {
    console.error("❌ AI Error:", error.response?.data || error.message);
  }

  // 2. Test Notion
  try {
    console.log("\nTesting Notion Access...");
    const user = await notion.users.me({});
    console.log("✅ Notion Connected as:", user.name);
    
    console.log("Checking Databases...");
    const db = await notion.databases.retrieve({ database_id: process.env.STARTUP_DB });
    console.log("✅ Found Startup Database:", db.title[0]?.plain_text || "Untitled");
  } catch (error) {
    console.error("❌ Notion Error:", error.message);
  }
}

testConnection();