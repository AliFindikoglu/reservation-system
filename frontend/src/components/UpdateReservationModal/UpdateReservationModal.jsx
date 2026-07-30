import { useEffect, useState } from "react";

import "./UpdateReservationModal.css";

import DateSelector from "../DateSelector/DateSelector";
import SeatGrid from "../SeatGrid/SeatGrid";

function UpdateReservationModal({
  isOpen,
  onClose,
  reservation,
}) {
  const [reservationDate, setReservationDate] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);

  useEffect(() => {
    if (!reservation) return;

    setReservationDate(
      reservation.reservationDate.split("T")[0]
    );

    setSelectedSeat(reservation.tableNumber);
  }, [reservation]);

  const today = new Date();

const maxDate = new Date();
maxDate.setMonth(maxDate.getMonth() + 1);

  if (!isOpen) return null;


  return (
    <div className="modal-overlay">
      <div className="update-modal large">
        <h2>Update Reservation</h2>

            <DateSelector
                selectedDate={
                    reservationDate
                    ? new Date(reservationDate)
                    : new Date()
                }
                onDateChange={(date) =>
                    setReservationDate(date.toISOString().split("T")[0])
                }
                minDate={today}
                maxDate={maxDate}
            />

        <SeatGrid
          availableTables={availableTables}
          selectedSeat={selectedSeat}
          onSeatClick={setSelectedSeat}
        />

        <div className="modal-actions">
          <button
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button className="save-btn">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdateReservationModal;