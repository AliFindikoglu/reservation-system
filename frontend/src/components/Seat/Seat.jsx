import "./Seat.css";

function Seat({
  number,
  isReserved,
  isMine,
  isSelected,
  onClick,
  disabled = false,
  status,
}) {
  let seatClass = status || "available";

  if (isSelected) {
    seatClass = "selected";
  } else if (isMine) {
    seatClass = "mine";
  } else if (isReserved) {
    seatClass = "reserved";
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
