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

import { getTableStatuses, getAvailableTables} from "../api/tableApi";
import { createReservation } from "../api/reservationsApi";

import { useAuth } from "../context/AuthContext";

import toast from "react-hot-toast";


function Home() {
    const [loadingTables, setLoadingTables] = useState(true);
    const [tableStatuses, setTableStatuses] = useState([]);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const today = new Date();

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);

    const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0]
    );

    const { login, register, currentUser, } = useAuth();

    //.....................................................................
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



//.....................................................................

async function loadTables() {
    setLoadingTables(true);
  try {
    if (currentUser){
    const data = await getTableStatuses(selectedDate);
    setTableStatuses(data.tables);
    } else{
        const data = await getAvailableTables(selectedDate);
        const availableTables = new Set(data.tables);
        const tables = Array.from({ length: 32 }, (_, i) => ({
        number: i + 1,
        status: availableTables.has(i + 1)
          ? "available"
          : "reserved",
      }));

      setTableStatuses(tables);
    }

  } catch (error) {
    console.error(error);
  } finally{
    setLoadingTables(false);
  }   
}

  useEffect(() => {
    loadTables();
  }, [selectedDate, currentUser]);


  function handleSeatClick(seatNumber) {
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }
    setSelectedSeat(selectedSeat === seatNumber ? null : seatNumber);
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
      toast.error("You already have a reservation for this day. Please choose another date.");
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
                selectedDate={new Date(selectedDate)}
                onDateChange={(date) =>
                    setSelectedDate(date.toISOString().split("T")[0])
                }
                minDate={today}
                maxDate={maxDate}
                />
            </Header>
          </div>


          <SeatLegend />

                <SeatGrid
                    tableStatuses={tableStatuses}
                    selectedSeat={selectedSeat}
                    onSeatClick={handleSeatClick}
                />      


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