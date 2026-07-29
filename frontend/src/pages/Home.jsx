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

import { login, register } from "../api/authApi";
import { getAvailableTables } from "../api/tableApi";
import { createReservation } from "../api/reservationsApi";

function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  function logout() {
    localStorage.removeItem("token");
    setCurrentUser(null);
    setSelectedSeat(null);
  }

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

    if (selectedSeat === seatNumber) {
      setSelectedSeat(null);
    } else {
      setSelectedSeat(seatNumber);
    }
  }

  async function handleReserve() {
      console.log("Reserve clicked");
      console.log("Seat:", selectedSeat);
      console.log("Date:", selectedDate);
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

  return (
    <div className="home-page">
      <SideBar />

      <div className="main-content">
        <div className="hero">
          <div className="header-card">
            <Header
              currentUser={currentUser}
              onLogin={() => setIsLoginOpen(true)}
              onRegister={() => setIsRegisterOpen(true)}
              onLogout={logout}
            >
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
            onOpenRegister={() => {
                setIsLoginOpen(false);
                setIsRegisterOpen(true);
            }}
            onLogin={async (credentials) => {
              try {
                const data = await login(credentials);

                localStorage.setItem("token", data.accessToken);
                setCurrentUser(data.user);

                setIsLoginOpen(false);

                console.log("Login Succes", data);
              } catch (error) {
                console.error("Login error:", error);
              }
            }}
          />

          <RegisterModal
  isOpen={isRegisterOpen}
  onRegister={async (user) => {
    try {
      const data = await register(user);

      localStorage.setItem("token", data.accessToken);
      setCurrentUser(data.user);

      setIsRegisterOpen(false);

      console.log("Kayıt başarılı", data);
    } catch (error) {
      console.error("Register hatası:", error);
    }
  }}
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