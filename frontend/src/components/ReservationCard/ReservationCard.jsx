import "./ReservationCard.css";
import { CalendarDays, Trash2, Pencil } from "lucide-react";

function ReservationCard({
  reservation,
  isPast = false,
  onUpdate,
  onCancel,
}) {
  const date = new Date(reservation.reservationDate).toLocaleDateString(
    "tr-TR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className={`reservation-card ${isPast ? "past-card" : ""}`}>
      <div className="table-box">
        <span>MASA</span>
        <h2>{reservation.tableNumber}</h2>
      </div>

      <div className="reservation-info">
        <div className="reservation-date">
          <CalendarDays size={16} />
          <span>{date}</span>
        </div>

        {!isPast && (
          <div className="reservation-actions">
            <button 
            className="delete-btn"
            onClick={() => onCancel(reservation.id)}>
                
              <Trash2 size={18} />
            </button>

            <button
              className="update-btn"
              onClick={() => onUpdate(reservation)}
            >
              <Pencil size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReservationCard;