import { Bell } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import Sidebar from "../components/Sidebar/Sidebar"; 
import "../styles/Admin.css";

function AdminLayout() {
  const { currentUser } = useAuth();

  return (
    <div className="admin-shell">
      
      <Sidebar isAdmin={true} />

      <section className="admin-main">
        
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">DeskReserve administration</p>
            <h1>Admin workspace</h1>
          </div>
          <div className="admin-account">
            <button
              type="button"
              className="admin-icon-button"
              aria-label="Notifications"
            >
              <Bell size={19} />
            </button>
            <span className="admin-avatar">
              {currentUser?.fullName?.slice(0, 1)?.toUpperCase() ?? "A"}
            </span>
            <span className="admin-account-copy">
              <strong>{currentUser?.fullName}</strong>
              <small>Administrator</small>
            </span>
          </div>
        </header>

        
        <main className="admin-content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}

export default AdminLayout;