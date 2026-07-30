import { useEffect, useState } from "react";
import { CalendarX2 } from "lucide-react";

import Header from "../components/Header/Header";
import SideBar from "../components/SideBar/SideBar";
import ReservationCard from "../components/ReservationCard/ReservationCard";

import { getMyReservations } from "../api/reservationsApi";

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingReservations = reservations
    .filter((reservation) => {
      const reservationDate = new Date(reservation.reservationDate);
      reservationDate.setHours(0, 0, 0, 0);
      return reservationDate >= today;
    })
    .sort(
      (a, b) =>
        new Date(a.reservationDate) - new Date(b.reservationDate)
    );

  const pastReservations = reservations
    .filter((reservation) => {
      const reservationDate = new Date(reservation.reservationDate);
      reservationDate.setHours(0, 0, 0, 0);
      return reservationDate < today;
    })
    .sort(
      (a, b) =>
        new Date(b.reservationDate) - new Date(a.reservationDate)
    );

  return (
    <div className="home-page">
      <SideBar />

      <div className="main-content">
        <div className="header-card">
          <Header
            title="My Reservations"
            subtitle="View and manage your upcoming reservations."
          />
        </div>

        <main className="reservations-page">
          <section className="reservation-section">
            <h2>Upcoming Reservations</h2>

            <div className="reservation-list">
              {upcomingReservations.length === 0 ? (
                <div className="empty-state">
                  <CalendarX2 size={42} />
                  <h3>No upcoming reservations</h3>
                  <p>You don't have any upcoming reservations yet.</p>
                </div>
              ) : (
                upcomingReservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                  />
                ))
              )}
            </div>
          </section>

          <section className="reservation-section">
            <h2>Past Reservations</h2>

            <div className="reservation-list">
              {pastReservations.length === 0 ? (
                <div className="empty-state">
                  <CalendarX2 size={42} />
                  <h3>No past reservations</h3>
                  <p>Your reservation history will appear here.</p>
                </div>
              ) : (
                pastReservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    isPast
                  />
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default MyReservations;