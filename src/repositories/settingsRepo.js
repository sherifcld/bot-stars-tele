import { readCollection, writeCollection, generateId } from "../storage/jsonStore.js";

const COLLECTION = "settings";

export const getSetting = async (key) => {
  const items = await readCollection(COLLECTION);
  return items.find((s) => s.key === key) || null;
};

export const setSetting = async (key, value) => {
  const items = await readCollection(COLLECTION);
  const now = new Date().toISOString();
  const idx = items.findIndex((s) => s.key === key);
  if (idx === -1) {
    items.push({
      id: generateId(),
      key,
      value,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    items[idx] = { ...items[idx], value, updatedAt: now };
  }
  await writeCollection(COLLECTION, items);
};

