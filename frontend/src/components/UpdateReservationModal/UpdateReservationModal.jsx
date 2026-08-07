import { useEffect, useState, useRef } from "react";

import "./UpdateReservationModal.css";

import DateSelector from "../DateSelector/DateSelector";
import SeatGrid from "../SeatGrid/SeatGrid";
import SeatLegend from "../SeatLegend/SeatLegend";
import ReservationSummary from "../ReservationSummary/ReservationSummary"

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
  const [showEquipments, setShowEquipments] = useState(false);
  const equipmentRef = useRef(null);


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

  useEffect(() => {
  function handleClickOutside(event) {
    if (
      equipmentRef.current &&
      !equipmentRef.current.contains(event.target)
    ) {
      setShowEquipments(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);



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


        <ReservationSummary
        selectedSeat={selectedSeat ?? reservation.tableNumber}
        currentSeat={currentSeat}
        selectedDate={reservationDate}
        equipments={equipments}
        onReserve={handleSave}
        buttonText="Save Changes"
        showCancel = {true}
        onCancel={onClose}
        isUpdateMode={true}
        isModal = {true}
        equipmentPlacement="bottom"

        />


        <div className="seat-selection-card">
          <div className="seat-toolbar">
           <SeatLegend /> 

           <div className="toolbar-date">
            <span className="toolbar-date-label">
              Reservation Date
            </span>
        
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

          </div>
        </div>
          <SeatGrid

            tableStatuses={tableStatuses}
            tableCount={tableStatuses.length}
            currentSeat={currentSeat}
            selectedSeat={selectedSeat}
            onSeatClick={(seat)=>{
               if (seat === currentSeat) return;
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
            isModal = {true}
          />



        </div>




      </div>


    </div>

  );

}


export default UpdateReservationModal;
