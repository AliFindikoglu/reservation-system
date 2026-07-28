import "./SideBar.css";
import { Map, CalendarDays, Settings, Building2 } from "lucide-react";


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