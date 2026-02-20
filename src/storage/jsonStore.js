import fs from "fs/promises";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

const ensureFile = async (name) => {
  await fs.mkdir(dataDir, { recursive: true });
  const filePath = path.join(dataDir, `${name}.json`);
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf-8");
  }
  return filePath;
};

export const readCollection = async (name) => {
  const filePath = await ensureFile(name);
  const content = await fs.readFile(filePath, "utf-8");
  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
};

export const writeCollection = async (name, items) => {
  const filePath = await ensureFile(name);
  await fs.writeFile(filePath, JSON.stringify(items, null, 2), "utf-8");
};

export const generateId = () => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

