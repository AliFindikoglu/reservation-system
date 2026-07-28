import "./SeatGrid.css";
import Seat from "../Seat/Seat";

function SeatGrid({ reservations, selectedDate, selectedSeat, onSeatClick }) {
  const seats = Array.from({ length: 32 }, (_, index) => index + 1);
  const isMine = false; 
  return (
    <div className="seat-grid">
      {seats.map((seatNumber) => {
  const reservation = reservations.find(
    (reservation) => reservation.tableNumber === seatNumber && reservation.reservationDate === selectedDate
  );

  const isReserved = !!reservation;

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
