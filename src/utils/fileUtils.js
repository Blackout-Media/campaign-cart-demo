import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
  }
}

export async function findFiles(pattern, basePath) {
  try {
    const files = await glob(pattern, {
      cwd: basePath,
      nodir: true
    });
    return files.map(file => path.join(basePath, file));
  } catch (error) {
    throw new Error(`Failed to find files with pattern ${pattern}: ${error.message}`);
  }
}

export async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

export async function writeFile(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    await ensureDirectoryExists(dir);
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error.message}`);
  }
}

export function getRelativePath(fromPath, toPath) {
  return path.relative(fromPath, toPath);
}

export function getOutputPath(inputPath, inputDir, outputDir) {
  const relativePath = path.relative(inputDir, inputPath);
  return path.join(outputDir, relativePath);
}