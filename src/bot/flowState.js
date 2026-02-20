const states = new Map();

export const setUserState = (chatId, state) => {
  states.set(chatId, state);
};

export const getUserState = (chatId) => {
  return states.get(chatId);
};

export const clearUserState = (chatId) => {
  states.delete(chatId);
};

