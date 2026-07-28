import { useState } from "react";
import "../styles/Home.css";
import SeatGrid from "../components/SeatGrid/SeatGrid";
import Reservation from "../mock/Reservation";
import DateSelector from "../components/DateSelector/DateSelector";
import LoginModal from "../components/LoginModal/LoginModal";
import SideBar from "../components/SideBar/SideBar";
import Header from "../components/Header/Header";

function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [reservations, setReservations] = useState(Reservation);
  const[selectedSeat, setSelectedSeat] = useState(null);

//DATE KISMI
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
    }
    else{
        setSelectedSeat(seatNumber);
    }
}

  return (
    <div className="home-page">
        <SideBar />

        <div className="main-content">

             <div className="hero">

     <Header>
         <DateSelector
             selectedDate={selectedDate}
             onDateChange={setSelectedDate}
             minDate={today}
             maxDate={new Date(today).setMonth(new Date(today).getMonth() + 1)}
         />
     </Header>

        <div className="reservation-card">
            <h3>Reservation</h3>

            <p>Seat: {selectedSeat ?? "-"}</p>
            <p>Date: {selectedDate}</p>

            <button disabled={!selectedSeat}>
            Reserve
            </button>
        </div>

        
//ŞİMDİLİK BACKEND BAĞLANDIKTAN SONRA DEĞİŞTİRİLECEK LOGİN MODAL
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

        <SeatGrid
          reservations={filteredReservations}
          selectedDate={selectedDate}
          selectedSeat={selectedSeat}
          onSeatClick={handleSeatClick}
        />
            </div>
        </div>
    </div>
  );
}

export default Home;