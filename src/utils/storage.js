import { jwtDecode } from "jwt-decode";

const SESSION_NOTICE_KEY = "session_notice";
export const SESSION_EXPIRED_MESSAGE = "Tu sesion expiro. Inicia sesion nuevamente.";

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

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("rol");
};

export const setSessionNotice = (message) => {
  if (!message) return;
  localStorage.setItem(SESSION_NOTICE_KEY, String(message));
};

export const consumeSessionNotice = () => {
  const notice = localStorage.getItem(SESSION_NOTICE_KEY) || "";
  if (notice) {
    localStorage.removeItem(SESSION_NOTICE_KEY);
  }
  return notice;
};

export const markSessionExpired = () => {
  setSessionNotice(SESSION_EXPIRED_MESSAGE);
};

export const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return !decoded?.exp || decoded.exp > nowInSeconds;
  } catch {
    return false;
  }
};
