import path from "node:path";
import fs from "node:fs/promises";
import esbuild, { type TransformResult } from "esbuild";
import { parse } from "es-module-lexer";
import { extensions } from "./utils";

export type Page = {
  name: string;
  graph: ModuleGraph;
};

export type ModuleGraph = {
  module: ModuleNode;
};

export type ModuleNode = {
  filePath: string;
  dependencies: ModuleNode[];
};

const loadedModules: Map<string, ModuleNode | undefined> = new Map();

function isJSFileSpecifier(specifier: string): boolean {
  const ext = path.extname(specifier);
  if (
    ext !== extensions.JS &&
    ext !== extensions.TS &&
    ext !== extensions.TSX &&
    ext !== extensions.JSX &&
    ext !== extensions.DIR
  ) {
    return false;
  }
  if (
    specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    specifier.startsWith("~/")
  ) {
    return true;
  }
  return false;
}

function isAliasSpecifier(specifier: string): boolean {
  return specifier.startsWith("~/");
}

function convertAliasSpecifier(specifier: string, baseDirPath: string): string {
  return path.join(baseDirPath, specifier.replace("~/", ""));
}

async function transpileToJS(code: string) {
  const loaders = ["tsx", "ts"] as const;
  let transformResult: TransformResult | undefined;
  let error: unknown | undefined;
  for (const loader of loaders) {
    try {
      transformResult = await esbuild.transform(code, { loader });
    } catch (e) {
      error = e;
    }
  }
  if (transformResult) {
    return transformResult.code;
  }
  throw error;
}

async function readFile(filePath: string) {
  return await fs.readFile(filePath, "utf-8");
}

function getImportSpecifiers(code: string) {
  const [imports] = parse(code);
  return imports.map((specifier) => specifier.n);
}

async function joinPath(filePath: string, specifier: string) {
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      return path.join(filePath, specifier);
    }
  } catch {
    // do nothing
  }
  return path.join(filePath, "..", specifier);
}

async function convertSpcifierToPath(
  specifier: string,
  filePath: string,
  baseDirPath: string
): Promise<string> {
  const newFilePath = isAliasSpecifier(specifier)
    ? convertAliasSpecifier(specifier, baseDirPath)
    : await joinPath(filePath, specifier);
  let err: unknown | undefined;
  const exts = Object.values(extensions);
  for (const ext of exts) {
    try {
      const stat = await fs.stat(newFilePath + ext);
      if (stat.isDirectory()) {
        for (const ext of exts) {
          const filePath = path.join(newFilePath, "index" + ext);
          try {
            await fs.stat(filePath);
            return filePath;
          } catch (e) {
            err = e;
          }
        }
      }
      return newFilePath + ext;
    } catch (e) {
      err = e;
    }
  }
  throw err;
}

async function analyzeModule(
  filePath: string,
  baseDirPath: string
): Promise<ModuleNode> {
  const moduleNode: ModuleNode = {
    filePath: path.relative(baseDirPath, filePath),
    dependencies: [],
  };
  const fileContent = await readFile(filePath);

  const code = await transpileToJS(fileContent);

  for (const specifier of getImportSpecifiers(code)) {
    if (specifier && isJSFileSpecifier(specifier)) {
      const newFilePath = await convertSpcifierToPath(
        specifier,
        filePath,
        baseDirPath
      );
      if (!loadedModules.has(newFilePath)) {
        loadedModules.set(newFilePath, undefined);
        const newModule = await analyzeModule(newFilePath, baseDirPath);
        loadedModules.set(newFilePath, newModule);
        moduleNode.dependencies.push(newModule);
      } else {
        const module = loadedModules.get(newFilePath);
        if (module) {
          moduleNode.dependencies.push(module);
        }
      }
    }
  }
  return moduleNode;
}

export async function analyzePage(
  pagesDirPath: string,
  pageFileName: string
): Promise<Page> {
  const baseDir = path.join(pagesDirPath, "..");
  const moduleNode = await analyzeModule(
    path.join(pagesDirPath, pageFileName),
    baseDir
  );
  const moduleGraph: ModuleGraph = {
    module: moduleNode,
  };
  return {
    name: pageFileName,
    graph: moduleGraph,
  };
}
