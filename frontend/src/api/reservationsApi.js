const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function createReservation(reservation) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reservation),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const rawMessage = data?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage[0]
      : rawMessage || "Reservation creation failed.";
    throw new Error(message);
  }

  return response.json();
}

export async function getMyReservations() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/reservations/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch reservations.");
  }

  return response.json();
}

export async function cancelReservation(id) {
  const token = localStorage.getItem("token");

  console.log("TOKEN:", token);

  const response = await fetch(
    `${BASE_URL}/reservations/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to cancel reservation.");
  }
}

export async function updateReservation(id, reservation){
    const token = localStorage.getItem("token");

    const response = await fetch(
        `${BASE_URL}/reservations/${id}`,
        {
            method : "PATCH",
            headers:{
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(reservation),
        }
    );

if (!response.ok) {
  const error = await response.text();
  console.log(error);

  throw new Error(error);
}
    return response.json();
}
