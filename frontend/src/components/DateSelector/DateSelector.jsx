import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import "./DateSelector.css";

function DateSelector({ selectedDate, onDateChange }) {

  const today = new Date();

  const oneMonthLater = new Date(today);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  return (
    <div className="date-picker">
      <Calendar size={18} />

      <DatePicker
        selected={new Date(selectedDate)}
        onChange={(date) => onDateChange(date.toISOString().split("T")[0])}
        minDate={today}
        maxDate={oneMonthLater}
        dateFormat="d MMMM yyyy"
        onKeyDown={(e) => e.preventDefault()}
      />
    </div>
  );
}

export default DateSelector;