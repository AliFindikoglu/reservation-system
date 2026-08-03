const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const rawMessage = data?.message;
    throw new Error(Array.isArray(rawMessage) ? rawMessage[0] : rawMessage || "Notifications could not be loaded.");
  }
  return data;
}

export const notificationsApi = {
  getMine: () => request("/notifications/me"),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
};
