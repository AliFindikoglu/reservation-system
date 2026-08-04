import { Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../NotificationBell/NotificationBell";
import "./Header.css";

function Header({
  isAdmin = false,
  title = "Book a Desk",
  subtitle = "Reserve your spot for today.",
  eyebrow = "DeskReserve administration",
  adminTitle = "Admin workspace",
  onLogin,
  onRegister,
  children,
}) {
  const { currentUser } = useAuth();

  return (
    <header className="topbar-header">
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {isAdmin ? (
          <div>
            <p className="admin-eyebrow">{eyebrow}</p>
            <h1>{adminTitle}</h1>
          </div>
        ) : (
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
        )}
      </div>

      <div className="admin-account">
  
        {children}

        {currentUser ? (
          <>
            <NotificationBell />

           
            <span className="admin-avatar">
              {currentUser?.fullName?.slice(0, 1)?.toUpperCase() ?? "U"}
            </span>

            
            <span className="admin-account-copy">
              <strong>{currentUser?.fullName}</strong>
              <small>
                {currentUser?.role === "ADMIN" ? "Administrator" : "User"}
              </small>
            </span>
          </>
        ) : (
         
          <div style={{ display: "flex", gap: "10px" }}>
            {onLogin && (
              <button
                type="button"
                className="admin-button secondary"
                onClick={onLogin}
              >
                Sign In
              </button>
            )}
            {onRegister && (
              <button
                type="button"
                className="admin-button primary"
                onClick={onRegister}
              >
                Sign Up
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;