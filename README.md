# Founder OS - AI-Powered Startup Automation

Founder OS is an advanced automation framework designed to streamline the early stages of startup creation using **Notion** and **AI**. It integrates with the **Model Context Protocol (MCP)** to provide an interactive AI assistant that can research markets, generate Product Requirements Documents (PRDs), and manage your startup's roadmap directly within Notion.

## 🚀 Features

- **Interactive AI Assistant (MCP Server)**: Connect your Notion workspace to Claude Desktop or any MCP client to manage your startup via natural language.
- **Market Research**: Automatically search the web for competitors and market trends using the Tavily API.
- **AI-Driven PRD Generation**: Generate professional, structured Product Requirements Documents (PRDs) as sub-pages in your Notion database.
- **Automated Task Management**: Brainstorm MVP tasks using AI and automatically sync them to a dedicated Notion "Tasks" database.
- **Roadmap Automation**: Populate a "Roadmap" database with standard milestones (Design, Build, Test, Launch) for every new idea.
- **Batch Processing**: Run a standalone automation script to process all startup ideas at once.

## 🛠️ Architecture & Approach

Founder OS follows a modular service-oriented architecture:
1. **Notion Service (`notion.js`)**: A unified client for all Notion API interactions.
2. **AI Service (`ai.js`)**: Leverages OpenRouter to access state-of-the-art LLMs for task and PRD generation.
3. **Search Service (`search.js`)**: Uses the Tavily API for deep web research and competitor analysis.
4. **MCP Server (`server.js`)**: Exposes these services as "tools" to an AI model, allowing it to perform actions on your behalf.
5. **Automation Core (`index.js`)**: A batch processing script for bulk automation.

## 📋 Prerequisites

- **Node.js** (v18 or higher recommended).
- A **Notion Internal Integration Token** ([Create one here](https://www.notion.so/my-integrations)).
- An **OpenRouter API Key** (for AI generation).
- A **Tavily API Key** (for market research).
- **Four Notion Databases**:
  1. **Startup Ideas**: Properties: `Idea Name` (Title), `Goal` (Rich Text).
  2. **Tasks**: Properties: `Task` (Title), `Status` (Select), `Related Idea` (Relation).
  3. **Roadmap**: Properties: `Milestone` (Title), `Status` (Select).
  4. **Competitors**: Properties: `Name` (Title), `URL` (URL), `Description` (Rich Text), `Related Idea` (Relation).

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sunder-Kumar/founder-os.git
   cd founder-os
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   NOTION_TOKEN=your_notion_integration_token
   OPENROUTER_API_KEY=your_openrouter_api_key
   TAVILY_API_KEY=your_tavily_api_key
   STARTUP_DB=your_startup_ideas_database_id
   TASK_DB=your_tasks_database_id
   ROADMAP_DB=your_roadmap_database_id
   COMPETITOR_DB=your_competitors_database_id
   ```

4. **Verify Connection:**
   Run the built-in diagnostic tools to ensure your tokens and database IDs are correct:
   ```bash
   node test_connection.js
   node debug_notion.js
   ```

## 🎮 Usage

### Method 1: Interactive AI (Recommended)
Add Founder OS to your **Claude Desktop** configuration (`%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "founder-os": {
      "command": "node",
      "args": ["C:/absolute/path/to/founder-os/server.js"]
    }
  }
}
```
*Note: Use absolute paths to ensure the `.env` file loads correctly.*

### Method 2: Batch Automation
Run the standalone script to process all pending ideas in your Notion database:
```bash
node index.js
```

## 🧪 Troubleshooting

- **Token Errors**: Ensure your Notion integration is explicitly **shared** with each of the four databases.
- **Missing Data Source**: If ideas aren't being fetched, ensure your Notion database is shared with the integration and try running `node debug_notion.js`.
- **MCP Connection**: If Claude cannot connect, check the logs or ensure you are using the absolute path to `server.js` in your config.

## 📄 License
ISC
