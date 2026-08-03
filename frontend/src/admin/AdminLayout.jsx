import {
  Armchair,
  Ban,
  BarChart3,
  Bell,
  Building2,
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Map,
  Users,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Admin.css";

const navItems = [
  { to: "/admin", end: true, icon: LayoutDashboard, label: "Overview" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/reservations", icon: CalendarRange, label: "Reservations" },
  { to: "/admin/assignments", icon: Armchair, label: "Permanent Assignments" },
  { to: "/admin/restrictions", icon: Ban, label: "Restrictions" },
  { to: "/admin/desks", icon: Map, label: "Desk Management" },
  { to: "/admin/audit-logs", icon: ClipboardList, label: "Audit Log" },
];

function AdminLayout() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark"><Building2 size={27} /></span>
          <span><strong>Eteration</strong><small>ADMIN CONSOLE</small></span>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          <span className="admin-nav-label">MANAGEMENT</span>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <NavLink to="/" className="admin-workspace-link">
            <BarChart3 size={17} /> User workspace
          </NavLink>
          <button type="button" className="admin-logout" onClick={logout}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">DeskReserve administration</p>
            <h1>Admin workspace</h1>
          </div>
          <div className="admin-account">
            <button type="button" className="admin-icon-button" aria-label="Notifications">
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
        <main className="admin-content"><Outlet /></main>
      </section>
    </div>
  );
}

export default AdminLayout;

