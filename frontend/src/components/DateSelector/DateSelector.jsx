import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import "./DateSelector.css";

function DateSelector({
  selectedDate,
  onDateChange,
  minDate,
  maxDate,
}) {
  return (
    <div className="date-picker">
      <Calendar size={18} />

      <DatePicker
        selected={selectedDate}
        onChange={onDateChange}
        minDate={minDate}
        maxDate={maxDate}
        dateFormat="d MMM yyyy"
        onKeyDown={(e) => e.preventDefault()}
      />
    </div>
  );
}

export default DateSelector;