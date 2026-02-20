import { readCollection, writeCollection, generateId } from "../storage/jsonStore.js";

const COLLECTION = "payments";

export const createPayment = async (data) => {
  const items = await readCollection(COLLECTION);
  const now = new Date().toISOString();
  const payment = {
    id: generateId(),
    provider: data.provider,
    providerReference: data.providerReference,
    method: data.method || null,
    amount: data.amount,
    currency: data.currency || "IDR",
    status: data.status || "PENDING",
    rawRequest: data.rawRequest || null,
    rawCallback: data.rawCallback || null,
    createdAt: now,
    updatedAt: now,
  };
  items.push(payment);
  await writeCollection(COLLECTION, items);
  return payment;
};

export const updatePaymentById = async (id, patch) => {
  const items = await readCollection(COLLECTION);
  const idx = items.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const updated = { ...items[idx], ...patch, updatedAt: now };
  items[idx] = updated;
  await writeCollection(COLLECTION, items);
  return updated;
};

export const findPaymentByProviderRef = async (provider, ref) => {
  const items = await readCollection(COLLECTION);
  return items.find((p) => p.provider === provider && p.providerReference === ref) || null;
};

