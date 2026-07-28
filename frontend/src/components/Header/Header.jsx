import "./Header.css";

function Header({ selectedDate, children }) {
  return (
    <header className="header">

      <div className="header-left">
        <h1>Find your workspace</h1>
        <p>Select a date and reserve your seat.</p>
      </div>

      <div className="header-right">
        {children}
      </div>

    </header>
  );
}

export default Header;