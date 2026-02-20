import { readCollection, writeCollection, generateId } from "../storage/jsonStore.js";

const COLLECTION = "logs";

export const createLog = async (data) => {
  const items = await readCollection(COLLECTION);
  const now = new Date().toISOString();
  const log = {
    id: generateId(),
    level: data.level,
    message: data.message,
    meta: data.meta || null,
    createdAt: now,
    updatedAt: now,
  };
  items.push(log);
  await writeCollection(COLLECTION, items);
  return log;
};

export const getRecentLogs = async (limit = 20) => {
  const items = await readCollection(COLLECTION);
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
};

