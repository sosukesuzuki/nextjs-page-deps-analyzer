import fs from "node:fs/promises";
import path from "node:path";

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export const extensions = {
  TS: ".ts",
  TSX: ".tsx",
  JS: ".js",
  JSX: ".jsx",
  DIR: "",
};

export function isScriptFile(filePath: string) {
  const ext = path.extname(filePath);
  return Object.values(extensions).includes(ext);
}
