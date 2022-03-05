import { init } from "es-module-lexer";
import fs from "node:fs/promises";
import path from "node:path";
import { type Page, analyzePage } from "./analyzePage";
import { isScriptFile } from "./utils";

async function readdirRecursively(
  dir: string,
  baseDir: string,
  files: string[] = []
): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const dirs: string[] = [];
  for (const dirent of dirents) {
    if (dirent.isDirectory()) dirs.push(`${dir}/${dirent.name}`);
    if (dirent.isFile()) {
      const filePath = `${dir}/${dirent.name}`;
      if (isScriptFile(filePath)) {
        files.push(path.relative(baseDir, filePath));
      }
    }
  }
  for (const d of dirs) {
    files = await readdirRecursively(d, baseDir, files);
  }
  return Promise.resolve(files);
}

async function readPages(pagesDirPath: string): Promise<string[]> {
  const pages = await readdirRecursively(pagesDirPath, pagesDirPath);
  return pages;
}

export type ErrorPage = {
  name: string;
  cause: string;
};

function hasMessage(e: unknown): e is { message: string } {
  return Object.prototype.hasOwnProperty.call(e, "message");
}

export async function analyzePages(
  pagesDirPath: string
): Promise<(Page | ErrorPage)[]> {
  await init;
  const pageNames = await readPages(pagesDirPath);
  const pages = await Promise.all(
    pageNames.map(async (pageName) => {
      try {
        return await analyzePage(pagesDirPath, pageName);
      } catch (e) {
        if (hasMessage(e)) {
          return {
            name: pageName,
            cause: e.message,
          };
        } else {
          throw e;
        }
      }
    })
  );
  return pages;
}
