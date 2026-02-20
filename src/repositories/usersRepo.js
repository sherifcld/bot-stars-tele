import { readCollection, writeCollection, generateId } from "../storage/jsonStore.js";

const COLLECTION = "users";

export const findByTelegramId = async (telegramId) => {
  const items = await readCollection(COLLECTION);
  return items.find((u) => u.telegramId === telegramId) || null;
};

export const createUser = async (data) => {
  const items = await readCollection(COLLECTION);
  const now = new Date().toISOString();
  const user = {
    id: generateId(),
    telegramId: data.telegramId,
    username: data.username || null,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    totalSpent: 0,
    ordersCount: 0,
    balance: 0,
    createdAt: now,
    updatedAt: now,
  };
  items.push(user);
  await writeCollection(COLLECTION, items);
  return user;
};

export const findUserById = async (id) => {
  const items = await readCollection(COLLECTION);
  return items.find((u) => u.id === id) || null;
};

export const updateUser = async (id, patch) => {
  const items = await readCollection(COLLECTION);
  const idx = items.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const updated = { ...items[idx], ...patch, updatedAt: now };
  items[idx] = updated;
  await writeCollection(COLLECTION, items);
  return updated;
};
