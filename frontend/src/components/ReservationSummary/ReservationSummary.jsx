import "./ReservationSummary.css";

function ReservationSummary({
  selectedSeat,
  selectedDate,
  onReserve,
}) {
  const formattedDate = new Date(selectedDate).toLocaleDateString(
    "en-GB",
    {
      weekday: "long",
      day: "numeric",
      month: "short",
    }
  );

  return (
    <div className="reservation-card">
      <div className="reservation-info">

        <div className="reservation-icon">
          ⓘ
        </div>

        <div>
          <h4>Reservation Summary</h4>

          <p>
            {selectedSeat
              ? `Desk ${selectedSeat} selected for ${formattedDate}`
              : "Choose a desk from the office layout."}
          </p>
        </div>

      </div>

      <button
        className="reserve-button"
        disabled={!selectedSeat}
        onClick={onReserve}
      >
        Book Selected Seat →
      </button>
    </div>
  );
}

export default ReservationSummary;