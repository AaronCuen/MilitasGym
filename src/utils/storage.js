import { jwtDecode } from "jwt-decode";

const SESSION_NOTICE_KEY = "session_notice";
const ACTIVE_SUCURSAL_KEY = "active_sucursal_id";
const SUCURSAL_CHANGE_EVENT = "active_sucursal_change";
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
  localStorage.removeItem(ACTIVE_SUCURSAL_KEY);
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

export const getActiveSucursalId = () => {
  const raw = localStorage.getItem(ACTIVE_SUCURSAL_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

export const setActiveSucursalId = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    localStorage.removeItem(ACTIVE_SUCURSAL_KEY);
    window.dispatchEvent(new Event(SUCURSAL_CHANGE_EVENT));
    return;
  }
  localStorage.setItem(ACTIVE_SUCURSAL_KEY, String(parsed));
  window.dispatchEvent(new Event(SUCURSAL_CHANGE_EVENT));
};

export const clearActiveSucursalId = () => {
  localStorage.removeItem(ACTIVE_SUCURSAL_KEY);
  window.dispatchEvent(new Event(SUCURSAL_CHANGE_EVENT));
};

export const onSucursalChange = (handler) => {
  window.addEventListener(SUCURSAL_CHANGE_EVENT, handler);
  return () => window.removeEventListener(SUCURSAL_CHANGE_EVENT, handler);
};
