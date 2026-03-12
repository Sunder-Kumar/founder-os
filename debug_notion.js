const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const notion = require("./notion");

const STARTUP_DB = process.env.STARTUP_DB;

async function debugNotion() {
  console.log("--- Debugging Notion Database Queries ---");
  console.log("Database ID:", STARTUP_DB);

  // 1. Try standard databases.query
  try {
    console.log("\nAttempting notion.databases.query...");
    const response = await notion.databases.query({ database_id: STARTUP_DB });
    console.log("✅ Success! Found", response.results.length, "results.");
  } catch (error) {
    console.error("❌ databases.query Error:", error.message);
  }

  // 2. Try dataSources.query (as used in server.js/index.js)
  try {
    console.log("\nAttempting notion.dataSources.query approach...");
    const database = await notion.databases.retrieve({ database_id: STARTUP_DB });
    
    if (!database.data_sources || database.data_sources.length === 0) {
      console.log("⚠️ No data_sources property found on this database object.");
    } else {
      const dataSourceId = database.data_sources[0].id;
      console.log("Found Data Source ID:", dataSourceId);
      const response = await notion.dataSources.query({ data_source_id: dataSourceId });
      console.log("✅ Success! Found", response.results.length, "results.");
      if (response.results.length > 0) {
        console.log("\nFirst result properties:");
        console.log(JSON.stringify(response.results[0].properties, null, 2));
      }
    }
  } catch (error) {
    console.error("❌ dataSources.query approach Error:", error.message);
  }
}

debugNotion();
