require("dotenv").config();
const notion = require("./notion");
const generateTasks = require("./ai");

const STARTUP_DB = process.env.STARTUP_DB;
const TASK_DB = process.env.TASK_DB;
const ROADMAP_DB = process.env.ROADMAP_DB;

async function getStartupIdeas() {
  const database = await notion.databases.retrieve({ database_id: STARTUP_DB });
  
  if (!database.data_sources || database.data_sources.length === 0) {
    console.error("No data sources found for database:", STARTUP_DB);
    return [];
  }

  const dataSourceId = database.data_sources[0].id;
  
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
  });

  return response.results;
}

async function createTask(taskName, ideaId) {
  await notion.pages.create({
    parent: { database_id: TASK_DB },
    properties: {
      Task: {
        title: [
          {
            text: { content: taskName },
          },
        ],
      },
      Status: {
        select: { name: "Pending" },
      },
      "Related Idea": {
        relation: [{ id: ideaId }],
      },
    },
  });
}

async function createRoadmap(milestone) {
  await notion.pages.create({
    parent: { database_id: ROADMAP_DB },
    properties: {
      Milestone: {
        title: [
          {
            text: { content: milestone },
          },
        ],
      },
      Status: {
        select: { name: "Planned" },
      },
    },
  });
}

async function runAutomation() {
  const ideas = await getStartupIdeas();
  console.log(`Found ${ideas.length} entries in the Ideas database.`);

  let processedCount = 0;
  for (const idea of ideas) {
    const ideaName = idea.properties["Idea Name"]?.title[0]?.plain_text;
    const goal = idea.properties["Goal"]?.rich_text[0]?.plain_text;

    if (!ideaName) continue;

    processedCount++;
    console.log("Processing idea:", ideaName);

    const tasks = await generateTasks(ideaName, goal);

    // create tasks
    for (const task of tasks) {
      await createTask(task, idea.id);
      console.log("Task created:", task);
    }

    // create roadmap milestones
    await createRoadmap("Design MVP");
    await createRoadmap("Build Core Features");
    await createRoadmap("Test Product");
    await createRoadmap("Launch MVP");

    console.log("Roadmap created for:", ideaName);
  }

  if (processedCount === 0 && ideas.length > 0) {
    console.warn("Found entries, but none had a valid 'Idea Name'. Please check your Notion database.");
  } else if (ideas.length === 0) {
    console.warn("The Ideas database is empty.");
  }
}

runAutomation();