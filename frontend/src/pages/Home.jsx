import { useState } from "react";
import "../styles/Home.css";
import SeatGrid from "../components/SeatGrid/SeatGrid";
import Reservation from "../mock/Reservation";
import DateSelector from "../components/DateSelector/DateSelector";
import LoginModal from "../components/LoginModal/LoginModal";
import SideBar from "../components/SideBar/SideBar";
import Header from "../components/Header/Header";
import ReservationSummary from "../components/ReservationSummary/ReservationSummary";
import SeatLegend from "../components/SeatLegend/SeatLegend";

function Home() {
  // Test için giriş yapılmış kullanıcı
  const [currentUser, setCurrentUser] = useState({
    email: "damla@eteration.com",
  });

  const [reservations, setReservations] = useState(Reservation);
  const [selectedSeat, setSelectedSeat] = useState(null);

  // DATE
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const filteredReservations = reservations.filter(
    (reservation) => reservation.reservationDate === selectedDate
  );

  const [notification, setNotification] = useState({
    message: "",
    type: "",
  });

  function handleSeatClick(seatNumber) {
    if (selectedSeat === seatNumber) {
      setSelectedSeat(null);
    } else {
      setSelectedSeat(seatNumber);
    }
  }

  return (
    <div className="home-page">
      <SideBar />

      <div className="main-content">
        <div className="hero">

            <div className = "header-card">
                <Header>
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              minDate={today}
              maxDate={new Date(today).setMonth(new Date(today).getMonth() + 1)}
            />
          </Header>
                </div>

          

          <SeatLegend />

          <div className="seat-grid-wrapper">
            <SeatGrid
                reservations={filteredReservations}
                selectedDate={selectedDate}
                selectedSeat={selectedSeat}
                onSeatClick={handleSeatClick}
            />
        </div>

          <LoginModal
            isOpen={!currentUser}
            onLogin={(credentials) => {
              console.log(credentials);

              setCurrentUser({
                id: "1",
                fullName: "Damla Nur",
                email: credentials.email,
                phone: "",
              });
            }}
          />

        </div>
      </div>

            <ReservationSummary
                selectedSeat={selectedSeat}
                selectedDate={selectedDate}
                onReserve={() => {
        // backend çağrısı burada olacak
            }}
/>
    </div>
  );
}

export default Home;