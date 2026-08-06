import "./ReservationSummary.css";
import { useState } from "react";
import { getSeatLabel } from "../../utils/seatUtil";

function ReservationSummary({
  selectedSeat,
  selectedDate,
  onReserve,
  disabled = false,
  disabledMessage,
  equipments = [],
}) {

  const [showEquipment, setShowEquipment] = useState(false);


  const formattedDate = new Date(selectedDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });


  return (
    <div className="summary-card">


      <div className="summary-content">

        <div className="summary-icon">
          ⓘ
        </div>


        <div className="summary-text">

          <h4>
            Reservation Summary
          </h4>


          <p>
            {disabled && disabledMessage
              ? disabledMessage
              : selectedSeat
                ? `Desk ${getSeatLabel(selectedSeat)} selected for ${formattedDate}`
                : "Choose a desk from the office layout."
            }
          </p>

        </div>

      </div>



      {selectedSeat && (
        <div className="summary-equipment-section">


          <span className="equipment-title">
            Equipment
          </span>


          <div className="equipment-list">


            {equipments.length > 0 ? (

              <>

                {equipments.slice(0,2).map((equipment)=>(
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
                      onClick={() => setShowEquipment(!showEquipment)}
                    >
                      +{equipments.length - 2} more
                    </button>



                    {showEquipment && (

                      <div className="equipment-popover">

                        <h5>
                          All Equipment
                        </h5>


                        {equipments.map((equipment)=>(
                          <div
                            key={equipment.id}
                            className="popover-item"
                          >

                            <strong>
                              {equipment.name}
                            </strong>

                            <span>
                              {equipment.code}
                            </span>

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




      <button
        className="summary-button"
        disabled={!selectedSeat || disabled}
        onClick={onReserve}
      >
        Book Selected Seat →
      </button>


    </div>
  );
}

export default ReservationSummary;