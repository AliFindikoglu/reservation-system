import { useEffect, useState } from "react";

import "./UpdateReservationModal.css";

import DateSelector from "../DateSelector/DateSelector";
import SeatGrid from "../SeatGrid/SeatGrid";
import SeatLegend from "../SeatLegend/SeatLegend";

import { updateReservation } from "../../api/reservationsApi";
import { getTableStatuses } from "../../api/tableApi";
import { getSeatLabel } from "../../utils/seatUtil";
import toast from "react-hot-toast";

function UpdateReservationModal({
  isOpen,
  onClose,
  reservation,
  onSuccess,
}) {

  const [reservationDate, setReservationDate] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [tableStatuses, setTableStatuses] = useState([]);
  const [currentSeat, setCurrentSeat] = useState(null);
  const [equipments, setEquipments] = useState([]);


  useEffect(() => {
    if (!reservation) return;

    const date = reservation.reservationDate.split("T")[0];

    setReservationDate(date);

    setCurrentSeat(reservation.tableNumber);
    setSelectedSeat(null);

  }, [reservation]);


  useEffect(() => {
    if (!reservationDate || !reservation?.office?.id) return;

    loadTables(reservationDate);

  }, [reservationDate, reservation?.office?.id]);


  async function loadTables(date) {

    try {

      const data = await getTableStatuses(reservation.office.id, date);

      setTableStatuses(data.tables);


      const currentTable = data.tables.find(
        table => table.number === reservation.tableNumber
      );


      if(currentTable){

        setEquipments(
          currentTable.equipments || []
        );

      }


    } catch(error){

      console.error(error);

    }

  }



  async function handleSave(){

    try{

      await updateReservation(
        reservation.id,
        {
          officeId: reservation.office.id,
          tableNumber: selectedSeat,
          reservationDate,
        }
      );


      if(onSuccess){

        await onSuccess();

        toast.success(
          "Reservation updated successfully."
        );

      }


      onClose();


    }catch(error){

      console.error(error);

      toast.error(
        "Reservation update failed."
      );

    }

  }



  const today = new Date();

  const maxDate = new Date();

  maxDate.setMonth(
    maxDate.getMonth() + 1
  );



  if(!isOpen) return null;



  return (

    <div
      className="modal-overlay"
      onClick={onClose}
    >

      <div
        className="update-modal"
        onClick={(e)=>e.stopPropagation()}
      >


        <h2>
          Update Reservation
        </h2>



        <DateSelector

          selectedDate={
            reservationDate
              ? new Date(reservationDate)
              : new Date()
          }

          onDateChange={(date)=>
            setReservationDate(
              date.toISOString().split("T")[0]
            )
          }

          minDate={today}

          maxDate={maxDate}

        />




<div className="update-summary">

  <div className="summary-left">

    <h4>Reservation Summary</h4>

    <p>
      You're updating your reservation to{" "}
      <strong>
        {selectedSeat ? getSeatLabel(selectedSeat) : getSeatLabel(reservation.tableNumber)}
      </strong>{" "}
      on{" "}
      <strong>
        {new Date(reservationDate).toLocaleDateString(
          "en-GB",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
          }
        )}
      </strong>.
    </p>

  </div>


  {/* EQUIPMENT ORTA ALAN */}

  <div className="summary-equipment-section">

    <span className="equipment-title">
      Equipment
    </span>


    <div className="equipment-list">

      {equipments.length > 0 ? (

        equipments.slice(0, 2).map((equipment) => (
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
        ))

      ) : (

        <span className="no-equipment">
          No equipment assigned
        </span>

      )}


      {equipments.length > 2 && (
        <button className="equipment-more">
          +{equipments.length - 2} more
        </button>
      )}

    </div>

  </div>



  {/* BUTTONLAR SAĞ */}

  <div className="summary-buttons">

    <button
      className="cancel-btn"
      onClick={onClose}
    >
      Cancel
    </button>


    <button
      className="save-btn"
      onClick={handleSave}
    >
      Save Changes →
    </button>

  </div>


</div>

        <div className="seat-selection-card">


          <h4>
            Select a New Desk
          </h4>



          <SeatLegend />



          <SeatGrid

            tableStatuses={tableStatuses}

            tableCount={tableStatuses.length}

            currentSeat={currentSeat}

            selectedSeat={selectedSeat}


            onSeatClick={(seat)=>{


              setSelectedSeat(seat);



              const table =
                tableStatuses.find(
                  t=>t.number === seat
                );



              setEquipments(
                table?.equipments || []
              );


            }}


            isUpdateMode={true}

          />



        </div>




      </div>


    </div>

  );

}


export default UpdateReservationModal;
