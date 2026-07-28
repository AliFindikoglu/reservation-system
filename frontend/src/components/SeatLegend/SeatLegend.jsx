import "./SeatLegend.css";

function SeatLegend() {
  return (
    <div className="seat-legend">

      <div className="legend-item">
        <span className="legend-color available"></span>
        <span>Available</span>
      </div>

      <div className="legend-item">
        <span className="legend-color selected"></span>
        <span>Selected</span>
      </div>

      <div className="legend-item">
        <span className="legend-color mine"></span>
        <span>My Reservation</span>
      </div>

      <div className="legend-item">
        <span className="legend-color reserved"></span>
        <span>Reserved</span>
      </div>

    </div>
  );
}

export default SeatLegend;