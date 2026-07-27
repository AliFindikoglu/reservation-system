function DateSelector({ selectedDate, onDateChange }) {
    return(
        <div className="date-selector">
            <label>Reservation Date</label>
            <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
            />
        </div>
    );
}

export default DateSelector;