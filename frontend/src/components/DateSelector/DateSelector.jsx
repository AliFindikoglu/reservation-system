import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import "./DateSelector.css";

function DateSelector({ selectedDate, onDateChange }) {
  return (
    <div className="date-picker">
      <Calendar size={18} />

      <DatePicker
        selected={new Date(selectedDate)}
        onChange={(date) => onDateChange(date.toISOString().split("T")[0])}
        minDate={new Date()}
        dateFormat="d MMMM yyyy"
        onKeyDown={(e) => e.preventDefault()}
/>
    </div>
  );
}

export default DateSelector;