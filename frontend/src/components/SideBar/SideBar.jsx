import "./SideBar.css";
import { Map, CalendarDays, Settings } from "lucide-react";


function SideBar() {
  return (
    <aside className="sideBar">
      <h2 className="logo">Seat Management</h2>

      <nav>
        <button className="active" color="#334155">
          <Map size={18} />
          <span>Floor Plan</span>
        </button>

        <button>
          <CalendarDays size={18} color="#334155" />
          <span>My Reservations</span>
        </button>

        <button>
          <Settings size={18} color="#334155" />
          <span>Settings</span>
        </button>
      </nav>
    </aside>
  );
}

export default SideBar;