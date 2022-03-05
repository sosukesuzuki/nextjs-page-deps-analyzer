import { test } from "uvu";
import * as assert from "uvu/assert";
import fs from "node:fs";
import path from "node:path";

import { analyzePages } from "../src/analyzePages";

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const SNAPSHOTS_DIR = path.join(__dirname, "snapshots");

type Fixture = {
  name: string;
  pagesDirPath: string;
};

function getFixtures(): Fixture[] {
  const fixtures = fs.readdirSync(FIXTURES_DIR);
  return fixtures.map((fixtureName) => {
    const fixturePath = path.join(FIXTURES_DIR, fixtureName);
    const pagesDirPath = path.join(fixturePath, "src/pages");
    return {
      name: fixtureName,
      pagesDirPath,
    };
  });
}

function getSnapshotPath({ name }: Fixture) {
  return path.join(SNAPSHOTS_DIR, name + ".json");
}

function writeSnapshot(newSnapshot: string, fixture: Fixture) {
  fs.writeFileSync(getSnapshotPath(fixture), newSnapshot);
}

function getSnapshot(fixture: Fixture) {
  return fs.readFileSync(getSnapshotPath(fixture), "utf-8");
}

function hasSnapshot(fixture: Fixture) {
  const snapshotPath = getSnapshotPath(fixture);
  return fs.existsSync(snapshotPath);
}

async function generateAnalyzedPagesString(fixture: Fixture) {
  const analyzedPages = await analyzePages(fixture.pagesDirPath);
  return JSON.stringify(analyzedPages, null, 2);
}

const fixtures = getFixtures();

for (const fixture of fixtures) {
  test(fixture.name, async () => {
    if (hasSnapshot(fixture)) {
      if (process.env.OVERWRIITE) {
        const newSnapshot = await generateAnalyzedPagesString(fixture);
        writeSnapshot(newSnapshot, fixture);
        assert.fixture(newSnapshot, newSnapshot);
      } else {
        const actual = await generateAnalyzedPagesString(fixture);
        const expected = getSnapshot(fixture);
        assert.fixture(actual, expected);
      }
    } else {
      const newSnapshot = await generateAnalyzedPagesString(fixture);
      writeSnapshot(newSnapshot, fixture);
    }
  });
}

test.run();
