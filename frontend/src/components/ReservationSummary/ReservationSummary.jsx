import "./ReservationSummary.css";
import { useState, useEffect, useRef } from "react";
import { getSeatLabel } from "../../utils/seatUtil";

function ReservationSummary({
  selectedSeat,
  selectedDate,
  currentSeat,
  isUpdateMode = false,
  isModal = false,
  onReserve,
  disabled = false,
  disabledMessage,
  equipments = [],
  buttonText = "Book Selected Seat →",
  showCancel = false,
  onCancel,
}) {
  const [showEquipment, setShowEquipment] = useState(false);
  const equipmentRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        equipmentRef.current &&
        !equipmentRef.current.contains(event.target)
      ) {
        setShowEquipment(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formattedDate = new Date(selectedDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <div
  className={`summary-card ${isModal ? "summary-card-modal" : ""}`}
>
      <div className="summary-content">
        <div className="summary-icon">ⓘ</div>

        <div className="summary-text">
          <h4>Reservation Summary</h4>

<p>
  {disabled && disabledMessage ? (
    disabledMessage
  ) : isUpdateMode ? (
    selectedSeat ? (
      <>
        Your reservation will be updated from{" "}
        <strong>Desk {getSeatLabel(currentSeat)}</strong> to{" "}
        <br />
        <strong>Desk {getSeatLabel(selectedSeat)}</strong> for{" "}
        <strong>{formattedDate}</strong>.
      </>
    ) : (
      "Choose a new desk to update your reservation."
    )
  ) : selectedSeat ? (
    <>
      <strong>Desk {getSeatLabel(selectedSeat)}</strong> selected for{" "}
      <strong>{formattedDate}</strong>.
    </>
  ) : (
    "Choose a desk from the office layout."
  )}
</p>
        </div>
      </div>

      {selectedSeat && (
        <div
          className="summary-equipment-section"
          ref={equipmentRef}
        >
          <span className="equipment-title">
            Equipment
          </span>

          <div className="equipment-list">
            {equipments.length > 0 ? (
              <>
                {equipments.slice(0, 2).map((equipment) => (
                  <div
                    key={equipment.id}
                    className="equipment-item"
                  >
                    <span className="equipment-name">
                      {equipment.name}
                    </span>

                    <span className="equipment-code">
                      {equipment.code}
                    </span>
                  </div>
                ))}

                {equipments.length > 2 && (
                  <div className="equipment-more-wrapper">
                    <button
                      className="equipment-more"
                      onClick={() => setShowEquipment((prev) => !prev)}
                    >
                      +{equipments.length - 2} more
                    </button>

                    {showEquipment && (
                      <div className="equipment-popover">
                        <h5>All Equipment</h5>

                        {equipments.map((equipment) => (
                          <div
                            key={equipment.id}
                            className="popover-item"
                          >
                            <strong>{equipment.name}</strong>
                            <span>{equipment.code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <span className="no-equipment">
                No equipment assigned
              </span>
            )}
          </div>
        </div>
      )}

      <div className="summary-actions">
        {showCancel && (
          <button
            className="cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}

        <button
          className="summary-button"
          disabled={!selectedSeat || disabled}
          onClick={onReserve}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

export default ReservationSummary;