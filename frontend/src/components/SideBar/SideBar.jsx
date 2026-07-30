import "./SideBar.css";
import { Map, CalendarDays, Settings, Building2 } from "lucide-react";
import { NavLink } from "react-router-dom";

function SideBar() {
  return (
    <aside className="sideBar">
      <div className="sidebar-logo">
        <div className="logo-box">
          <Building2 size={30} strokeWidth={2.2} />
        </div>

        <div className="logo-text">
          <h3>Eteration</h3>
          <span>ITU-ARI3</span>
        </div>
      </div>

      <nav>
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "sidebar-btn active" : "sidebar-btn")}
        >
          <Map size={18} />
          <span>Floor Plan</span>
        </NavLink>

        <NavLink
          to="/my-reservations"
          className={({ isActive }) => (isActive ? "sidebar-btn active" : "sidebar-btn")}
        >
          <CalendarDays size={18} />
          <span>My Reservations</span>
        </NavLink>

        <button className="sidebar-btn">
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </nav>
    </aside>
  );
}

export default SideBar;