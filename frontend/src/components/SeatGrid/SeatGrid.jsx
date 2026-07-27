import "./SeatGrid.css";
import Seat from "../Seat/Seat";

function SeatGrid({ reservations, selectedDate, selectedSeat, onSeatClick }) {
  const seats = Array.from({ length: 32 }, (_, index) => index + 1);
    
  return (
    <div className="seat-grid">
      {seats.map((seatNumber) => {
  const reservation = reservations.find(
    (reservation) => reservation.seatNumber === seatNumber && reservation.date === selectedDate
  );

  const isReserved = !!reservation;
  const isMine = reservation?.email === "damla@eteration.com";

  return (
    <Seat
      key={seatNumber}
      number={seatNumber}
      isReserved={isReserved}
      isMine={isMine}
      isSelected={selectedSeat === seatNumber}
      onClick={() => {
        if (!isReserved) {
            onSeatClick(seatNumber);
            }
      }}
    />
  );
})}
    </div>
  );
}

export default SeatGrid;
