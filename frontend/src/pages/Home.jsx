import { useState, useEffect } from "react";

import "../styles/Home.css";

import SeatGrid from "../components/SeatGrid/SeatGrid";
import DateSelector from "../components/DateSelector/DateSelector";
import LoginModal from "../components/LoginModal/LoginModal";
import SideBar from "../components/SideBar/SideBar";
import Header from "../components/Header/Header";
import ReservationSummary from "../components/ReservationSummary/ReservationSummary";
import SeatLegend from "../components/SeatLegend/SeatLegend";
import RegisterModal from "../components/RegisterModal/RegisterModal";

import { getAvailableTables } from "../api/tableApi";
import { createReservation } from "../api/reservationsApi";

import { useAuth } from "../context/AuthContext";


function Home() {
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const { login, register, currentUser, } = useAuth();


//.....................................................................
    async function handleLogin(credentials) {
  try {
    await login(credentials);
    setIsLoginOpen(false);
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

async function handleRegister(user) {
  try {
    await register(user);
    setIsRegisterOpen(false);
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
}




//.....................................................................


  async function loadTables() {
    try {
      const data = await getAvailableTables(selectedDate);
      setAvailableTables(data.tables);
    } catch (error) {
      console.error("Error fetching available tables:", error);
    }
  }


  useEffect(() => {
    loadTables();
  }, [selectedDate]);


  function handleSeatClick(seatNumber) {
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }
    setSelectedSeat(selectedSeat === seatNumber ? null : seatNumber);
  }


  async function handleReserve() {
    if (!selectedSeat) {
      alert("Lütfen bir masa seçin.");
      return;
    }
    try {
      await createReservation({
        tableNumber: selectedSeat,
        reservationDate: selectedDate,
      });

      alert("Reservation created successfully.");

      await loadTables();
      setSelectedSeat(null);
    } catch (error) {
      console.error(error);
      alert("Reservation failed.");
    }
  }
  //.....................................................................


  return (
    <div className="home-page">
      <SideBar />

      <div className="main-content">
        <div className="hero">
          <div className="header-card">
            <Header
            onLogin={() => setIsLoginOpen(true)}
            onRegister={() => setIsRegisterOpen(true)}>
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
              availableTables={availableTables}
              selectedSeat={selectedSeat}
              onSeatClick={handleSeatClick}
            />
          </div>

          <LoginModal
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}            
            onOpenRegister={() => {
                setIsLoginOpen(false);
                setIsRegisterOpen(true);
            }}
            onLogin = {handleLogin}
          />

          <RegisterModal
    isOpen={isRegisterOpen}
    onClose={() => setIsRegisterOpen(false)}
    onOpenLogin={() => {
        setIsRegisterOpen(false);
        setIsLoginOpen(true);
    }}
    onRegister={handleRegister}
/>
        </div>
    </div>

      <ReservationSummary
        selectedSeat={selectedSeat}
        selectedDate={selectedDate}
        onReserve={handleReserve}
      />
    </div>
  );
}

export default Home;