const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

const notion = require("./notion");
const { generateTasks, generatePRD } = require("./ai");
const searchMarket = require("./search");

// ... (rest of the code)
const STARTUP_DB = process.env.STARTUP_DB;
const TASK_DB = process.env.TASK_DB;
const ROADMAP_DB = process.env.ROADMAP_DB;
const COMPETITOR_DB = process.env.COMPETITOR_DB;

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
        name: "save_competitor_research",
        description: "Save a found competitor into the Notion database.",
        inputSchema: {
          type: "object",
          properties: {
            ideaId: { type: "string", description: "Relation to the startup idea" },
            name: { type: "string", description: "Competitor name" },
            url: { type: "string", description: "Competitor website" },
            description: { type: "string", description: "What they do" },
          },
          required: ["ideaId", "name", "url"],
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
      {
        name: "generate_status_report",
        description: "Generate a weekly status report based on completed tasks in Notion.",
        inputSchema: {
          type: "object",
          properties: {
            ideaId: { type: "string", description: "The Notion UUID of the startup idea" },
          },
          required: ["ideaId"],
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

    if (name === "save_competitor_research") {
      if (!COMPETITOR_DB) throw new Error("COMPETITOR_DB not set in .env");

      await notion.pages.create({
        parent: { database_id: COMPETITOR_DB },
        properties: {
          Name: { title: [{ text: { content: args.name } }] },
          URL: { url: args.url },
          "Description": { rich_text: [{ text: { content: args.description || "No description provided." } }] },
          "Related Idea": { relation: [{ id: args.ideaId }] },
        },
      });
      return { content: [{ type: "text", text: `Saved competitor: ${args.name}` }] };
    }

    if (name === "create_prd_page") {
      const prd = await generatePRD(args.ideaName, args.goal, args.marketResearch || "N/A");
      
      const children = [
        { heading_1: { rich_text: [{ text: { content: "Executive Summary" } }] } },
        { paragraph: { rich_text: [{ text: { content: prd.summary || "No summary provided." } }] } },
        { heading_1: { rich_text: [{ text: { content: "Problem Statement" } }] } },
        { paragraph: { rich_text: [{ text: { content: prd.problem || "No problem statement provided." } }] } },
        
        { heading_1: { rich_text: [{ text: { content: "Market Gap Analysis" } }] } }
      ];

      // Add Table for Gap Analysis
      if (prd.competitorAnalysis && Array.isArray(prd.competitorAnalysis)) {
        const tableRows = [
          {
            table_row: {
              cells: [
                [{ text: { content: "Competitor" } }],
                [{ text: { content: "Strength" } }],
                [{ text: { content: "Weakness" } }],
                [{ text: { content: "Our Opportunity (Gap)" } }]
              ]
            }
          }
        ];

        prd.competitorAnalysis.forEach(c => {
          tableRows.push({
            table_row: {
              cells: [
                [{ text: { content: c.name || "N/A" } }],
                [{ text: { content: c.strength || "N/A" } }],
                [{ text: { content: c.weakness || "N/A" } }],
                [{ text: { content: c.gap || "N/A" } }]
              ]
            }
          });
        });

        children.push({
          table: {
            table_width: 4,
            has_column_header: true,
            has_row_header: false,
            children: tableRows
          }
        });
      }

      children.push(
        { heading_1: { rich_text: [{ text: { content: "Core Features" } }] } }
      );

      // Add each feature as a separate bullet point
      if (prd.features && Array.isArray(prd.features)) {
        prd.features.forEach(feature => {
          children.push({
            bulleted_list_item: { rich_text: [{ text: { content: feature } }] }
          });
        });
      }

      // Visual Roadmap using Mermaid.js
      children.push(
        { heading_1: { rich_text: [{ text: { content: "Visual Roadmap" } }] } },
        { 
          code: { 
            rich_text: [{ text: { content: `gantt
    title ${args.ideaName} MVP Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation
    Research & Discovery :done, des1, 2026-03-12, 3d
    Core Architecture    :active, des2, after des1, 5d
    section Phase 2: Build
    Feature Development  :des3, after des2, 10d
    UI Implementation    :des4, after des3, 7d
    section Phase 3: Launch
    Testing & QA         :des5, after des4, 5d
    MVP Launch           :milestone, des6, after des5, 0d` } }],
            language: "mermaid"
          }
        }
      );

      children.push(
        { heading_1: { rich_text: [{ text: { content: "Tech Stack" } }] } },
        { callout: { rich_text: [{ text: { content: prd.techStack || "Not specified." } }], icon: { emoji: "🛠️" } } }
      );

      await notion.pages.create({
        parent: { page_id: args.ideaId },
        properties: {
          title: {
            title: [{ text: { content: `PRD: ${args.ideaName}` } }]
          }
        },
        children: children
      });

      return { content: [{ type: "text", text: "Successfully created PRD page with Gap Analysis and Mermaid Roadmap." }] };
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

    if (name === "generate_status_report") {
      const response = await notion.databases.query({
        database_id: TASK_DB,
        filter: {
          property: "Related Idea",
          relation: { contains: args.ideaId }
        }
      });

      const tasks = response.results;
      const completed = tasks.filter(t => t.properties.Status?.select?.name === "Done").length;
      const total = tasks.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      const report = `📊 **Progress Report**\nCompletion: ${progress}%\nTasks: ${completed}/${total} completed.`;

      await notion.blocks.children.append({
        block_id: args.ideaId,
        children: [
          {
            callout: {
              rich_text: [{ text: { content: report } }],
              icon: { emoji: "📈" },
              color: "blue_background"
            }
          }
        ]
      });

      return { content: [{ type: "text", text: `Report generated for Idea ID: ${args.ideaId}. Progress: ${progress}%` }] };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error.body || error.message || error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}${error.body ? ` - ${JSON.parse(error.body).message}` : ""}` }],
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