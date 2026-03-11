require("dotenv").config();
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

const notion = require("./notion");
const { generateTasks, generatePRD } = require("./ai");
const searchMarket = require("./search");

// Database IDs from .env
const STARTUP_DB = process.env.STARTUP_DB;
const TASK_DB = process.env.TASK_DB;
const ROADMAP_DB = process.env.ROADMAP_DB;

/**
 * 1. Initialize the MCP Server
 */
const server = new Server(
  {
    name: "founder-os-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * 2. Define the Tools available to the AI
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_startup_ideas",
        description: "Fetch all startup ideas and goals from the Notion database.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "search_market",
        description: "Search the web for competitors and market trends for a startup idea.",
        inputSchema: {
          type: "object",
          properties: {
            idea: { type: "string", description: "The startup idea to research" },
          },
          required: ["idea"],
        },
      },
      {
        name: "create_prd_page",
        description: "Create a full PRD page in Notion for a startup idea.",
        inputSchema: {
          type: "object",
          properties: {
            ideaId: { type: "string", description: "The Notion UUID of the idea page" },
            ideaName: { type: "string" },
            goal: { type: "string" },
            marketResearch: { type: "string", description: "Summary of research from search_market" },
          },
          required: ["ideaId", "ideaName", "goal"],
        },
      },
      {
        name: "generate_mvp_tasks",
        description: "Use AI to generate 5 MVP tasks based on a startup idea and goal.",
        inputSchema: {
          type: "object",
          properties: {
            idea: { type: "string", description: "The name of the startup idea" },
            goal: { type: "string", description: "The primary goal of the startup" },
          },
          required: ["idea", "goal"],
        },
      },
      {
        name: "create_notion_task",
        description: "Create a specific task in the Notion Tasks database.",
        inputSchema: {
          type: "object",
          properties: {
            taskName: { type: "string" },
            ideaId: { type: "string", description: "The Notion UUID of the related idea" },
          },
          required: ["taskName", "ideaId"],
        },
      },
      {
        name: "create_roadmap_milestone",
        description: "Create a milestone in the Notion Roadmap database.",
        inputSchema: {
          type: "object",
          properties: {
            milestone: { type: "string", description: "The name of the milestone (e.g., 'Launch MVP')" },
          },
          required: ["milestone"],
        },
      },
    ],
  };
});

/**
 * 3. Handle Tool Execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_startup_ideas") {
      const database = await notion.databases.retrieve({ database_id: STARTUP_DB });
      const dataSourceId = database.data_sources[0].id;
      const response = await notion.dataSources.query({ data_source_id: dataSourceId });
      
      const ideas = response.results.map(idea => ({
        id: idea.id,
        name: idea.properties["Idea Name"]?.title[0]?.plain_text || "Unnamed Idea",
        goal: idea.properties["Goal"]?.rich_text[0]?.plain_text || "No goal set",
      }));

      return { content: [{ type: "text", text: JSON.stringify(ideas, null, 2) }] };
    }

    if (name === "search_market") {
      const research = await searchMarket(args.idea);
      return { 
        content: [{ type: "text", text: `Market Research for ${args.idea}:\n\n${research.answer}\n\nKey Competitors:\n${research.results.map(r => `- ${r.title}: ${r.url}`).join("\n")}` }] 
      };
    }

    if (name === "create_prd_page") {
      const prd = await generatePRD(args.ideaName, args.goal, args.marketResearch || "N/A");
      
      await notion.pages.create({
        parent: { page_id: args.ideaId }, // Nested under the idea page
        properties: {
          title: [{ text: { content: `PRD: ${args.ideaName}` } }],
        },
        children: [
          { heading_1: { rich_text: [{ text: { content: "Executive Summary" } }] } },
          { paragraph: { rich_text: [{ text: { content: prd.summary } }] } },
          { heading_1: { rich_text: [{ text: { content: "Problem Statement" } }] } },
          { paragraph: { rich_text: [{ text: { content: prd.problem } }] } },
          { heading_1: { rich_text: [{ text: { content: "Core Features" } }] } },
          { bulleted_list_item: { rich_text: prd.features.map(f => ({ text: { content: f } })) } }, // Simplification
          { heading_1: { rich_text: [{ text: { content: "Tech Stack" } }] } },
          { callout: { rich_text: [{ text: { content: prd.techStack } }], icon: { emoji: "🛠️" } } }
        ]
      });

      return { content: [{ type: "text", text: "Successfully created PRD page as a sub-page of your idea." }] };
    }

    if (name === "generate_mvp_tasks") {
      const tasks = await generateTasks(args.idea, args.goal);
      return { content: [{ type: "text", text: `Generated Tasks: ${tasks.join(", ")}` }], isError: false };
    }

    if (name === "create_notion_task") {
      await notion.pages.create({
        parent: { database_id: TASK_DB },
        properties: {
          Task: { title: [{ text: { content: args.taskName } }] },
          Status: { select: { name: "Pending" } },
          "Related Idea": { relation: [{ id: args.ideaId }] },
        },
      });
      return { content: [{ type: "text", text: `Successfully created task: ${args.taskName}` }] };
    }

    if (name === "create_roadmap_milestone") {
      await notion.pages.create({
        parent: { database_id: ROADMAP_DB },
        properties: {
          Milestone: { title: [{ text: { content: args.milestone } }] },
          Status: { select: { name: "Planned" } },
        },
      });
      return { content: [{ type: "text", text: `Successfully created roadmap milestone: ${args.milestone}` }] };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

/**
 * 4. Start the server using Stdio transport
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Founder OS MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});