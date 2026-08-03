import "./Seat.css";

function Seat({
  number,
  isReserved,
  isMine,
  isSelected,
  onClick,
  disabled = false,
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
      disabled={disabled}
    >
      {number}
    </button>
  );
}

export default Seat;
