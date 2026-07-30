import "./Header.css";

function Header({ 
    children, 
    currentUser, 
    onLogin, 
    onRegister, 
    onLogout,
    title = "Find your workspace",
    subtitle = "Select a date and reserve your seat."
}) {

  return (
    <header className="header">
      <div className="header-left">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="header-right">
        {children}
        {!currentUser?(
            <div className="auth-buttons">
                <button onClick={onLogin}>Login</button>
                <button onClick={onRegister}>Register</button>
                </div>

        ) : (
            <div className="user-info">
                <span>{currentUser.fullName}</span>
                <button onClick={onLogout}>Logout</button>
            </div>
        )}
      </div>
    </header>
  );
}

export default Header;