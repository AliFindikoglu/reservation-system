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
import { getOffices } from "../api/officesApi";

import { useAuth } from "../context/AuthContext";

import toast from "react-hot-toast";

function Home() {
  const [tableStatuses, setTableStatuses] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [activeRestriction, setActiveRestriction] = useState(null);
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState("");
  const [tableCount, setTableCount] = useState(32);
  const [tableLoadError, setTableLoadError] = useState("");
  
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

  useEffect(() => {
    let active = true;
    getOffices()
      .then((data) => {
        if (!active) return;
        setOffices(data);
        const preferred = data.find(
          (office) => office.id === currentUser?.preferredOfficeId,
        );
        const istanbul = data.find(
          (office) => office.city.toLowerCase() === "istanbul",
        );
        setSelectedOfficeId((current) => {
          if (preferred) return preferred.id;
          if (!currentUser) return (istanbul ?? data[0])?.id ?? "";
          return data.some((office) => office.id === current)
            ? current
            : (istanbul ?? data[0])?.id ?? "";
        });
      })
      .catch((error) => setTableLoadError(error.message));
    return () => {
      active = false;
    };
  }, [currentUser]);

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
    if (!selectedOfficeId) return;
    try {
      setTableLoadError("");
      if (currentUser) {
        const [tableData, restrictions] = await Promise.all([
          getTableStatuses(selectedOfficeId, selectedDate),
          getMyRestrictions(),
        ]);
        const restriction = restrictions.find((item) => {
          if (item.revokedAt) return false;
          const startsOn = item.startsOn.slice(0, 10);
          const endsOn = item.endsOn.slice(0, 10);
          return startsOn <= selectedDate && selectedDate <= endsOn;
        });

        setTableStatuses(tableData.tables);
        setTableCount(tableData.tables.length);
        setActiveRestriction(restriction ?? null);
        if (restriction) setSelectedSeat(null);
      } else {
        setActiveRestriction(null);
        const data = await getAvailableTables(selectedOfficeId, selectedDate);
        const availableTables = new Set(data.tables);
        const tables = Array.from({ length: data.tableCount }, (_, i) => ({
          number: i + 1,
          status: availableTables.has(i + 1) ? "available" : "reserved",
        }));

        setTableStatuses(tables);
        setTableCount(data.tableCount);
      }
    } catch (error) {
      console.error(error);
      setTableStatuses([]);
      setTableLoadError(error.message || "The floor plan could not be loaded.");
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadTables();
    }, 0);

    return () => clearTimeout(timeoutId);
  // loadTables is intentionally recreated with the latest authentication and office state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedOfficeId, currentUser]);

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
        officeId: selectedOfficeId,
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
            <div className="office-switcher-row">
              <label className="office-switcher">
                <span>Office</span>
                <select
                  value={selectedOfficeId}
                  onChange={(event) => {
                    setSelectedOfficeId(event.target.value);
                    setSelectedSeat(null);
                  }}
                  disabled={offices.length === 0}
                >
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.city}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {tableLoadError && (
              <div className="restriction-banner" role="alert">
                <strong>Floor plan unavailable</strong>
                <span>{tableLoadError}</span>
              </div>
            )}

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
              tableCount={tableCount}
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
