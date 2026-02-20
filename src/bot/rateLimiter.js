const lastOrderMap = new Map();

const WINDOW_MS = 60 * 1000;

export const canCreateOrder = (userId) => {
  const now = Date.now();
  const last = lastOrderMap.get(userId);
  if (last && now - last < WINDOW_MS) {
    return false;
  }
  lastOrderMap.set(userId, now);
  return true;
};

