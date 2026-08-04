import { useEffect, useState } from "react";
import { CalendarX2 } from "lucide-react";

import Header from "../components/Header/Header";
import SideBar from "../components/SideBar/SideBar";
import ReservationCard from "../components/ReservationCard/ReservationCard";
import UpdateReservationModal from "../components/UpdateReservationModal/UpdateReservationModal";

import { getMyReservations, cancelReservation } from "../api/reservationsApi";

import "../styles/MyReservations.css";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

function MyReservations() {
  const [reservations, setReservations] = useState([]);

  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  function handleUpdate(reservation) {
    setSelectedReservation(reservation);
    setIsUpdateOpen(true);
  }

  async function loadReservations() {
    const data = await getMyReservations();
    setReservations(data);
  }

  useEffect(() => {
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

  async function handleCancel(id) {
    const result = await Swal.fire({
      title: "Cancel reservation?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "Keep reservation",
      confirmButtonColor: "#ff6b00",
      cancelButtonColor: "#94a3b8",
      reverseButtons: true,
      width: 380,
      padding: "1.5rem",
      background: "#ffffff",
      color: "#1f2937",
      backdrop: `
        rgba(15,23,42,0.45)
        backdrop-filter: blur(10px)
      `,
    });

    if (!result.isConfirmed) return;

    try {
      await cancelReservation(id);
      await loadReservations();
      await Swal.fire({
        icon: "success",
        title: "Reservation cancelled",
        text: "Your reservation has been successfully cancelled.",
        timer: 1800,
        showConfirmButton: false,
        width: 360,
        padding: "1.4rem",
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Cancellation failed",
        text: "Please try again later.",
        width: 360,
        padding: "1.4rem",
        borderRadius: 18,
      });
    }
  }

  return (
    <div className="home-page">
      <SideBar />

      {/* 📍 KİLİT NOKTA: Header ve İçeriği toplayan ana kapsayıcı */}
      <div className="home-main-wrapper">
        
        {/* 📍 Header artık kutuların dışında, doğrudan tepeye sıfırlanır */}
        <Header
          title="My Reservations"
          subtitle="View and manage your upcoming reservations."
        />

        {/* Header'ın altındaki padding'li ana içerik alanı */}
        <div className="main-content">
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
                      onUpdate={handleUpdate}
                      onCancel={handleCancel}
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

      <UpdateReservationModal
        isOpen={isUpdateOpen}
        reservation={selectedReservation}
        onClose={() => setIsUpdateOpen(false)}
        onSuccess={async () => {
          await loadReservations();
          setIsUpdateOpen(false);
        }}
      />
    </div>
  );
}

export default MyReservations;