const BASE_URL = "http://localhost:3000";

export async function getAvailableTables(date) {
  const response = await fetch(
    `${BASE_URL}/tables/available?date=${date}`
  );

  if (!response.ok) {
    throw new Error("Masalar alınamadı.");
  }

  return response.json();
}