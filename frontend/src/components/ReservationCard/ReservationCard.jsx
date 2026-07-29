import "./ReservationCard.css";
import { CalendarDays } from "lucide-react";

function ReservationCard({ reservation }) {
  const date = new Date(reservation.reservationDate).toLocaleDateString(
    "tr-TR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="reservation-card">
      <div className="table-box">
        <span>MASA</span>
        <h2>{reservation.tableNumber}</h2>
      </div>

      <div className="reservation-info">
        <div className="reservation-date">
          <CalendarDays size={16} />
          <span>{date}</span>
        </div>

        <div className="reservation-actions">
          <button className="delete-btn">Sil</button>
          <button className="update-btn">Güncelle</button>
        </div>
      </div>
    </div>
  );
}

export default ReservationCard;