import {
  Map,
  CalendarDays,
  Settings,
  ShieldCheck,
  Building2,
  LogOut,
  LayoutDashboard,
  Users,
  CalendarRange,
  Armchair,
  Ban,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const adminNavItems = [
  { to: "/admin", end: true, icon: LayoutDashboard, label: "Overview" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/reservations", icon: CalendarRange, label: "Reservations" },
  { to: "/admin/assignments", icon: Armchair, label: "Permanent Assignments" },
  { to: "/admin/restrictions", icon: Ban, label: "Restrictions" },
  { to: "/admin/desks", icon: Map, label: "Desk Management" },
  { to: "/admin/audit-logs", icon: ClipboardList, label: "Audit Log" },
];

function Sidebar({ isAdmin = false }) {
  const { currentUser, logout } = useAuth();

  return (
    <aside className="sidebar">
      {/* Brand / Logo Alanı */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">
          <Building2 size={27} />
        </span>
        <span>
          <strong>Eteration</strong>
          <small>{isAdmin ? "ADMIN CONSOLE" : "ITU-ARI3"}</small>
        </span>
      </div>

      {/* Navigasyon Linkleri */}
      <nav className="sidebar-nav" >
        <span className="sidebar-nav-label">
          {isAdmin ? "MANAGEMENT" : "MENU"}
        </span>

        {isAdmin ? (
          // Admin Menüsü
          adminNavItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar-nav-link${isActive ? " active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))
        ) : (
          // User Menüsü
          <>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `sidebar-nav-link${isActive ? " active" : ""}`
              }
            >
              <Map size={18} />
              <span>Floor Plan</span>
            </NavLink>

            {currentUser && (
              <>
                <NavLink
                  to="/my-reservations"
                  className={({ isActive }) =>
                    `sidebar-nav-link${isActive ? " active" : ""}`
                  }
                >
                  <CalendarDays size={18} />
                  <span>My Reservations</span>
                </NavLink>

                {currentUser.role === "ADMIN" && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `sidebar-nav-link${isActive ? " active" : ""}`
                    }
                  >
                    <ShieldCheck size={18} />
                    <span>Admin Panel</span>
                  </NavLink>
                )}
              </>
            )}
          </>
        )}
      </nav>

      {/* Alt Butonlar - Sadece Kullanıcı Giriş Yapmışsa Görünür */}
      {currentUser && (
        <div className="sidebar-bottom">
          {isAdmin ? (
            <NavLink to="/" className="sidebar-bottom-btn">
              <BarChart3 size={17} />
              <span>User workspace</span>
            </NavLink>
          ) : (
            <button type="button" className="sidebar-bottom-btn">
              <Settings size={17} />
              <span>Settings</span>
            </button>
          )}

          <button
            type="button"
            className="sidebar-bottom-btn logout-btn"
            onClick={logout}
          >
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;