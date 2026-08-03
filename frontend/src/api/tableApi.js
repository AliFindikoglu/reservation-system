const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function getAvailableTables(date) {
  const response = await fetch(
    `${BASE_URL}/tables/available?date=${date}`
  );

  if (!response.ok) {
    throw new Error("Masalar alınamadı.");
  }

  return response.json();
}

export async function getTableStatuses(date) {
  const token = localStorage.getItem("token");

  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${BASE_URL}/tables/statuses?date=${date}`,
    {
      headers,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch table statuses.");
  }

  return response.json();
}
