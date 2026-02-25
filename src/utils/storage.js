export const getStoredJSON = (key, fallback = null) => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const getStoredUser = () => getStoredJSON("user", null);
