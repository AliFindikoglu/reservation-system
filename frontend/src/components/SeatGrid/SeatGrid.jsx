import "./SeatGrid.css";
import Seat from "../Seat/Seat";

function SeatGrid({
  tableStatuses,
  selectedSeat,
  onSeatClick,
}) {
  const blocks = [
    { letter: "A", seats: [1, 2, 3, 4, 5, 6, 7, 8] },
    { letter: "B", seats: [9, 10, 11, 12, 13, 14, 15, 16] },
    { letter: "C", seats: [17, 18, 19, 20, 21, 22, 23, 24] },
    { letter: "D", seats: [25, 26, 27, 28, 29, 30, 31, 32] },
  ];

  console.log("tableStatuses:", tableStatuses);
  const renderSeat = (seatNumber, label) => {
    const table = tableStatuses.find(
      (table) => table.number === seatNumber
    );

    const isReserved = table?.status === "reserved";
    const isMine = table?.status === "mine";

    console.log(seatNumber, table, isMine, isReserved);

    return (
      <Seat
        key={seatNumber}
        number={label}
        isReserved={isReserved}
        isMine={isMine}
        isSelected={selectedSeat === seatNumber}
        onClick={() => {
          if (!isReserved && !isMine) {
            onSeatClick(seatNumber);
          }
        }}
      />
    );
  };

  return (
    <div className="office-container">
      <div className="office-layout">
        {blocks.map((block) => (
          <div className="column" key={block.letter}>
            <h4>{block.letter}</h4>

            <div className="seat-block">
              {block.seats.map((seatNumber, i) =>
                renderSeat(seatNumber, `${block.letter}${i + 1}`)
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="window-wall">
        <span>WINDOW</span>
      </div>
    </div>
  );
}

export default SeatGrid;