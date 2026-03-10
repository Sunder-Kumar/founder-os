# Founder OS - Startup Automation Tool

Founder OS is an automated tool designed to streamline the startup creation process using Notion and AI. It automatically fetches startup ideas from a Notion database, generates MVP tasks using AI, and creates task lists and roadmap milestones back in your Notion workspace.

## Features

- **Idea Tracking**: Fetches startup ideas and goals from a Notion "Ideas" database.
- **AI-Powered MVP Planning**: Uses OpenRouter AI to generate 5 key tasks needed to build an MVP for each idea.
- **Automated Task Management**: Creates entries in a dedicated Notion "Tasks" database, linked to the original idea.
- **Roadmap Generation**: Automatically populates a "Roadmap" database with standard MVP milestones.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended).
- A [Notion Integration Token](https://www.notion.so/my-integrations).
- An [OpenRouter API Key](https://openrouter.ai/).
- Three Notion Databases:
  1. **Startup Ideas**: Must contain "Idea Name" (Title) and "Goal" (Rich Text).
  2. **Tasks**: For storing generated MVP tasks.
  3. **Roadmap**: For milestone tracking.

## Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd founder-os
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   NOTION_TOKEN=your_notion_integration_token
   OPENROUTER_API_KEY=your_openrouter_api_key
   STARTUP_DB=your_startup_ideas_database_id
   TASK_DB=your_tasks_database_id
   ROADMAP_DB=your_roadmap_database_id
   ```

## Usage

Run the automation script:
```bash
node index.js
```

The script will:
1. Connect to your Notion Ideas database.
2. Find ideas that have an "Idea Name".
3. For each idea:
   - Generate 5 MVP tasks via OpenRouter.
   - Save those tasks to your "Tasks" database in Notion.
   - Create 4 standard roadmap milestones: "Design MVP", "Build Core Features", "Test Product", and "Launch MVP".

## Tech Stack

- **[Notion SDK for JavaScript](https://github.com/makenotion/notion-sdk-js)** (v5.x compatibility): Integration with Notion API.
- **[Axios](https://axios-http.com/)**: For making requests to the OpenRouter API.
- **[Dotenv](https://github.com/motdotla/dotenv)**: Environment variable management.
- **[OpenRouter](https://openrouter.ai/)**: Unified interface for AI models.

## Troubleshooting

- **No Ideas Found**: Ensure your "Startup Ideas" database entries have content in the "Idea Name" property.
- **Database Permissions**: Make sure your Notion Integration has access to all three databases.
- **Notion SDK v5.x**: This project is compatible with the latest Notion API (2025-09-03 and later), using `notion.dataSources.query` for database interactions.

## License

ISC
