import "./ReservationSummary.css";
import { getSeatLabel } from "../../utils/seatUtil";

function ReservationSummary({
  selectedSeat,
  selectedDate,
  onReserve,
  disabled = false,
  disabledMessage,
  equipments = [],
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
            {disabled && disabledMessage
            ? disabledMessage
            : selectedSeat
            ? `Desk ${getSeatLabel(selectedSeat)} selected for ${formattedDate}`              : "Choose a desk from the office layout."}
          </p>
          {selectedSeat && equipments.length > 0 && (
            <div className="summary-equipments" >
              {equipments.map((equipment) => <span key={equipment.id}>{equipment.name}</span>)}
            </div>
          )}
        </div>
      </div>

      <button
        className="summary-button"
        disabled={!selectedSeat || disabled}
        onClick={onReserve}
      >
        Book Selected Seat →
      </button>
    </div>
  );
}

export default ReservationSummary;
