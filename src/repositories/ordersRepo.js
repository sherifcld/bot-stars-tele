import { readCollection, writeCollection, generateId } from "../storage/jsonStore.js";

const COLLECTION = "orders";

export const createOrder = async (data) => {
  const items = await readCollection(COLLECTION);
  const now = new Date().toISOString();
  const order = {
    id: generateId(),
    userId: data.userId,
    orderCode: data.orderCode,
    starsAmount: data.starsAmount,
    unitPrice: data.unitPrice,
    totalPrice: data.totalPrice,
    targetUsername: data.targetUsername || null,
    status: data.status || "PENDING",
    paymentMethod: data.paymentMethod || null,
    paymentId: data.paymentId || null,
    createdAt: now,
    updatedAt: now,
  };
  items.push(order);
  await writeCollection(COLLECTION, items);
  return order;
};

export const updateOrderById = async (id, patch) => {
  const items = await readCollection(COLLECTION);
  const idx = items.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const updated = { ...items[idx], ...patch, updatedAt: now };
  items[idx] = updated;
  await writeCollection(COLLECTION, items);
  return updated;
};

export const findOrderByPaymentId = async (paymentId) => {
  const items = await readCollection(COLLECTION);
  return items.find((o) => o.paymentId === paymentId) || null;
};

export const findOrdersByUserId = async (userId, limit = 10) => {
  const items = await readCollection(COLLECTION);
  return items
    .filter((o) => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
};

export const findRecentOrders = async (limit = 20) => {
  const items = await readCollection(COLLECTION);
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
};

export const countOrders = async (filter = {}) => {
  const items = await readCollection(COLLECTION);
  return items.filter((o) => {
    return Object.entries(filter).every(([k, v]) => o[k] === v);
  }).length;
};

export const sumTotalPrice = async (filter = {}) => {
  const items = await readCollection(COLLECTION);
  return items
    .filter((o) => {
      return Object.entries(filter).every(([k, v]) => o[k] === v);
    })
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
};

