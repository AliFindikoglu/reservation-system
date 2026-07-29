const BASE_URL = "http://localhost:3000";
export async function createReservation(reservation) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/reservations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(reservation),
    });
    if (!response.ok) {
        throw new Error("Reservation creation failed");
    }
    return response.json();
}