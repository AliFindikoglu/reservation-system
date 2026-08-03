const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function getMyRestrictions() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/restrictions/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const rawMessage = data?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage[0]
      : rawMessage || "Your restrictions could not be loaded.";
    throw new Error(message);
  }

  return data;
}
