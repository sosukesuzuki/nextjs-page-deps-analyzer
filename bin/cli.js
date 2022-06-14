#!/usr/bin/env node

import { analyzePages } from "../dist/index.js";

const args = process.argv.slice(2);

const pagesDirPath = args[0];

if (!pagesDirPath) {
  throw new Error("The path of pages is required.");
}

const result = await analyzePages(pagesDirPath);

process.stdout.write(JSON.stringify(result) + "\n");
