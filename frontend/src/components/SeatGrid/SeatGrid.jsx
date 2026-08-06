import "./SeatGrid.css";
import Seat from "../Seat/Seat";
import { Mars, Venus, Coffee } from "lucide-react";


function SeatGrid({
  tableStatuses = [],
  currentSeat,
  selectedSeat,
  onSeatClick,
  isUpdateMode = false,
  interactionDisabled = false,
  adminMode = false,
  tableCount = 32,
  isModal = false,
}) {
  const blocks = [
    { letter: "A", seats: [1, 2, 3, 4, 5, 6, 7, 8] },
    { letter: "B", seats: [9, 10, 11, 12, 13, 14, 15, 16] },
    { letter: "C", seats: [17, 18, 19, 20, 21, 22, 23, 24] },
    { letter: "D", seats: [25, 26, 27, 28, 29, 30, 31, 32] },
  ];

  const renderSeat = (seatNumber, label) => {
    const table = tableStatuses.find((t) => t.number === seatNumber);

    const isReserved = table?.status === "reserved";
    const isMine = isUpdateMode
      ? seatNumber === currentSeat
      : table?.status === "mine";

    return (
      <Seat
        key={seatNumber}
        number={label}
        isReserved={isReserved}
        isMine={isMine}
        isSelected={selectedSeat === seatNumber}
        status={adminMode ? (table?.status ?? "available").replaceAll("_", "-") : undefined}
        disabled={interactionDisabled || (!adminMode && isReserved && !isMine)}
       onClick={() => {
  if (!interactionDisabled && (adminMode || !isReserved || isMine)) {
    onSeatClick(seatNumber);
  }
}}
      />
    );
  };

  const renderDesk = (block) => (
    <div className="table-card" key={block.letter}>
      <h4>{block.letter}</h4>

      <div className="desk-wrapper">
        <div className="desk-surface">
          {/* Sol Koltuk Sütunu */}
          <div className="seat-column left">
            {block.seats.slice(0, 4).map((seat, i) =>
              renderSeat(seat, `${block.letter}${i + 1}`)
            )}
          </div>

          {/* Sağ Koltuk Sütunu */}
          <div className="seat-column right">
            {block.seats.slice(4).map((seat, i) =>
              renderSeat(seat, `${block.letter}${i + 5}`)
            )}
          </div>
        </div>
      </div>
    </div>
  );

    return (
  <div
    className={`office-container ${
      isModal ? "office-container-modal" : ""
    }`}
  >
      <div className="office-top">
        {/* WC Alanı */}
        <div className="wc-area">
          <div className="room" title="Men WC">
            <Mars size={18} strokeWidth={2.5} className="wc-icon male" />
          </div>
          <div className="room" title="Women WC">
            <Venus size={18} strokeWidth={2.5} className="wc-icon female" />
          </div>
          

        </div>

        {/* Ana Koridor */}
        <div className="hallway">HALLWAY</div>

        {/* Küçültülmüş Mutfak */}
        <div className="kitchen" title="Kitchen">
          <Coffee size={18} strokeWidth={2.5} />
        </div>

        {/* İç İçe Ofis Kompleksi */}
        <div className="nested-office-suite">
          <div className="outer-office">Office-4</div>
          <div className="inner-office">Office-5</div>
        </div>

        {/* Depo */}
        <div className="storage"></div>
      </div>

      {/* ORTA ALAN */}
      <div className="office-middle">
        {}
        <div className="entrance">ENTRANCE</div>

        {/* Masalar ve Bar Lounge Alanı */}
        <div className="desk-layout">
          {renderDesk(blocks[0])}
          {renderDesk(blocks[1])}

          {/* Bar Masalı Lounge Alanı */}
          <div className="lounge">
            <span className="lounge-title">LOUNGE</span>

            <div className="bar-area">
              <div className="bar-table">
                <div className="bar-stools left">
                  <span className="stool"></span>
                  <span className="stool"></span>
                  <span className="stool"></span>
                </div>
                <div className="bar-stools right">
                  <span className="stool"></span>
                  <span className="stool"></span>
                  <span className="stool"></span>
                </div>
              </div>
            </div>
          </div>

          {tableCount > 16 && renderDesk(blocks[2])}
          {tableCount > 24 && renderDesk(blocks[3])}
        </div>

        {/* Sağ Ofis Bölmeleri */}
        <div className="right-offices">
          <div className="office-2">Office-2</div>
          <div className="office-1">Office-1</div>
        </div>
      </div>

      {/* ALT PENCERE DUVARI */}
      <div className="window-wall">WINDOWS</div>
    </div>
  );
}

export default SeatGrid;
