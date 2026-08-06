import { useState, useEffect } from "react";

import "../styles/Home.css";

import SeatGrid from "../components/SeatGrid/SeatGrid";
import DateSelector from "../components/DateSelector/DateSelector";
import LoginModal from "../components/LoginModal/LoginModal";
import Sidebar from "../components/Sidebar/Sidebar"; 
import Header from "../components/Header/Header";
import ReservationSummary from "../components/ReservationSummary/ReservationSummary";
import SeatLegend from "../components/SeatLegend/SeatLegend";
import RegisterModal from "../components/RegisterModal/RegisterModal";

import { getTableStatuses, getAvailableTables } from "../api/tableApi";
import { createReservation } from "../api/reservationsApi";
import { getMyRestrictions } from "../api/restrictionsApi";

import { useAuth } from "../context/AuthContext";

import toast from "react-hot-toast";

function Home() {
  const [tableStatuses, setTableStatuses] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [activeRestriction, setActiveRestriction] = useState(null);
  
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);

  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0]
  );

  const selectedTable = tableStatuses.find(
    (table) => table.number === selectedSeat
  );
console.log(selectedTable?.equipments);
  const { login, register, currentUser } = useAuth();

  async function handleLogin(credentials) {
    try {
      await login(credentials);
      toast.success("Welcome back!");
      setIsLoginOpen(false);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Invalid email or password.");
      throw error;
    }
  }

  async function handleRegister(user) {
    try {
      await register(user);
      toast.success("Account created successfully.");
      setIsRegisterOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Registration failed.");
      throw error;
    }
  }

  async function loadTables() {
    try {
      if (currentUser) {
        const [tableData, restrictions] = await Promise.all([
          getTableStatuses(selectedDate),
          getMyRestrictions(),
        ]);
        const restriction = restrictions.find((item) => {
          if (item.revokedAt) return false;
          const startsOn = item.startsOn.slice(0, 10);
          const endsOn = item.endsOn.slice(0, 10);
          return startsOn <= selectedDate && selectedDate <= endsOn;
        });

        setTableStatuses(tableData.tables);
        setActiveRestriction(restriction ?? null);
        if (restriction) setSelectedSeat(null);
      } else {
        setActiveRestriction(null);
        const data = await getAvailableTables(selectedDate);
        const availableTables = new Set(data.tables);
        const tables = Array.from({ length: 32 }, (_, i) => ({
          number: i + 1,
          status: availableTables.has(i + 1) ? "available" : "reserved",
        }));

        setTableStatuses(tables);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadTables();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [selectedDate, currentUser]);

  function handleSeatClick(seatNumber) {
  if (!currentUser) {
    setIsLoginOpen(true);
    return;
  }

  if (activeRestriction) {
    toast.error(
      activeRestriction.reason
        ? `You cannot make reservations during this period. Reason: ${activeRestriction.reason}`
        : "You cannot make reservations during this restricted period."
    );
    return;
  }

  const table = tableStatuses.find((t) => t.number === seatNumber);

  if (table?.status === "mine") {
    return;
  }

  setSelectedSeat((prev) => (prev === seatNumber ? null : seatNumber));
}
  async function handleReserve() {
    if (!selectedSeat) {
      toast.error("Please select a desk first.");
      return;
    }
    try {
      await createReservation({
        tableNumber: selectedSeat,
        reservationDate: selectedDate,
      });

      toast.success("Desk reserved successfully.");
      await loadTables();
      setSelectedSeat(null);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Reservation could not be created.");
    }
  }

  return (
    <div className="home-page">
      <Sidebar />

      <div className="home-main-wrapper">
        
        <Header
          onLogin={() => setIsLoginOpen(true)}
          onRegister={() => setIsRegisterOpen(true)}
        >
          <DateSelector
            selectedDate={new Date(selectedDate)}
            onDateChange={(date) =>
              setSelectedDate(date.toISOString().split("T")[0])
            }
            minDate={today}
            maxDate={maxDate}
          />
        </Header>

        <div className="main-content">
          <div className="hero">
            {activeRestriction && (
              <div className="restriction-banner" role="alert">
                <strong>Reservation access restricted</strong>
                <span>
                  You cannot select or reserve a desk for this date.
                  {activeRestriction.reason &&
                    ` Reason: ${activeRestriction.reason}`}
                </span>
              </div>
            )}

            <SeatLegend />

            <SeatGrid
              tableStatuses={tableStatuses}
              selectedSeat={selectedSeat}
              onSeatClick={handleSeatClick}
              interactionDisabled={Boolean(activeRestriction)}
            />
            

            <LoginModal
              isOpen={isLoginOpen}
              onClose={() => setIsLoginOpen(false)}
              onOpenRegister={() => {
                setIsLoginOpen(false);
                setIsRegisterOpen(true);
              }}
              onLogin={handleLogin}
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
      </div>

      <ReservationSummary
        selectedSeat={selectedSeat}
        selectedDate={selectedDate}
        onReserve={handleReserve}
        disabled={Boolean(activeRestriction)}
        disabledMessage="Reservations are disabled for this restricted date."
        equipments={selectedTable?.equipments ?? []}
      />
    </div>
  );
}

export default Home;