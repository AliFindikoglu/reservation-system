const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

async function parseResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const rawMessage = data?.message;
    throw new Error(
      (Array.isArray(rawMessage) ? rawMessage[0] : rawMessage) ||
        "Offices could not be loaded.",
    );
  }
  return data;
}

export async function getOffices() {
  return parseResponse(await fetch(`${BASE_URL}/offices`));
}

export async function getOffice(id) {
  return parseResponse(
    await fetch(`${BASE_URL}/offices/${encodeURIComponent(id)}`),
  );
}
