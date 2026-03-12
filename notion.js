const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });
const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN, // must match your .env
});

module.exports = notion;