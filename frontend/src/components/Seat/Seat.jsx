import "./Seat.css";

function Seat({
  number,
  isReserved,
  isMine,
  isSelected,
  onClick,
}) {
  let seatClass = "available";

  if (isMine) {
    seatClass = "mine";
  } else if (isReserved) {
    seatClass = "reserved";
  } else if (isSelected) {
    seatClass = "selected";
  }

  return (
    <button
      className={`seat ${seatClass}`}
      onClick={onClick}
    >
      {number}
    </button>
  );
}

export default Seat;