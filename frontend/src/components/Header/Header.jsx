import "./Header.css";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../NotificationBell/NotificationBell";

function Header({
  children,
  onLogin,
  onRegister,
  title = "Find your workspace",
  subtitle = "Select a date and reserve your seat.",
}) {
  const { currentUser, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <h1>
            {currentUser
            ? `Hello, ${currentUser.fullName.split(" ")[0]} 👋`
            : title}
        </h1>

        <p>
            {currentUser
            ? "Choose your workspace for today."
            : subtitle}
        </p>
        </div>

      <div className="header-right">
        {children}

        {!currentUser ? (
          <div className="auth-buttons">
            <button onClick={onLogin}>Login</button>
            <button onClick={onRegister}>Register</button>
          </div>
        ) : (
          <div className="user-info">
            <NotificationBell />
            <button onClick={logout}>Logout</button>
          </div>
          
        )}
      </div>
    </header>
  );
}

export default Header;
