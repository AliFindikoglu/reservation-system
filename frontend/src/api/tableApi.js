const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function getAvailableTables(officeId, date) {
  const response = await fetch(
    `${BASE_URL}/tables/available?officeId=${encodeURIComponent(officeId)}&date=${encodeURIComponent(date)}`
  );

  if (!response.ok) {
    throw new Error("Masalar alınamadı.");
  }

  return response.json();
}

export async function getTableStatuses(officeId, date) {
  const token = localStorage.getItem("token");

  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${BASE_URL}/tables/statuses?officeId=${encodeURIComponent(officeId)}&date=${encodeURIComponent(date)}`,
    {
      headers,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch table statuses.");
  }

  return response.json();
}
