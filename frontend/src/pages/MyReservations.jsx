import { useEffect, useState } from "react";
import SideBar from "../components/SideBar/SideBar";
import { getMyReservations } from "../api/reservationsApi";
import ReservationCard from "../components/ReservationCard/ReservationCard";
import "../styles/MyReservations.css";

function MyReservations() {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    async function loadReservations() {
      const data = await getMyReservations();
      setReservations(data);
    }

    loadReservations();
  }, []);

  return (
    <div className="home-page">
  <SideBar />

  <main className="reservations-page">

    <div className="reservations-header">
      <h1>Rezervasyonlarım</h1>
      <p>Yaklaşan rezervasyonlarınızı görüntüleyin.</p>
    </div>

    <div className="reservation-list">
  {reservations.length === 0 ? (
    <p>Henüz rezervasyonunuz bulunmuyor.</p>
  ) : (
    reservations.map((reservation) => (
      <ReservationCard
        key={reservation.id}
        reservation={reservation}
      />
    ))
  )}
</div>

  </main>
</div>
  );
}

export default MyReservations;