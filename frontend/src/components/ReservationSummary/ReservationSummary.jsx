import "./ReservationSummary.css";
import { getSeatLabel } from "../../utils/seatUtil";

function ReservationSummary({
  selectedSeat,
  selectedDate,
  onReserve,
}) {
  const formattedDate = new Date(selectedDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="summary-card">
      <div className="summary-content">
        <div className="summary-icon">ⓘ</div>

        <div className="summary-text">
          <h4>Reservation Summary</h4>

          <p>
            {selectedSeat
            ? `Desk ${getSeatLabel(selectedSeat)} selected for ${formattedDate}`              : "Choose a desk from the office layout."}
          </p>
        </div>
      </div>

      <button
        className="summary-button"
        disabled={!selectedSeat}
        onClick={onReserve}
      >
        Book Selected Seat →
      </button>
    </div>
  );
}

export default ReservationSummary;