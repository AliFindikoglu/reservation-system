import { Activity, Armchair, ArrowRight, Ban, CalendarCheck, UserCheck, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../api/adminApi";
import { ErrorState, LoadingState, PageHeading } from "./AdminUi";
import { toDateInput } from "./adminUtils";

function StatCard({ icon: Icon, label, value, note }) {
  return (
    <article className="admin-stat-card">
      <div className="admin-stat-head"><span>{label}</span><span className="admin-stat-icon"><Icon size={18} /></span></div>
      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-note">{note}</div>
    </article>
  );
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [users, reservations, assignments, restrictions, auditLogs] = await Promise.all([
        adminApi.getUsers(true),
        adminApi.getReservations(true),
        adminApi.getAssignments(true),
        adminApi.getRestrictions(true),
        adminApi.getAuditLogs(),
      ]);
      setData({ users, reservations, assignments, restrictions, auditLogs });
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState label="Loading admin overview..." />;

  const today = toDateInput();
  const activeUsers = data.users.filter((user) => user.isActive).length;
  const todaysReservations = data.reservations.filter(
    (item) => !item.isCancelled && item.reservationDate?.slice(0, 10) === today,
  ).length;
  const activeAssignments = data.assignments.filter((item) => !item.revokedAt).length;
  const activeRestrictions = data.restrictions.filter(
    (item) => !item.revokedAt && item.startsOn?.slice(0, 10) <= today && item.endsOn?.slice(0, 10) >= today,
  ).length;

  const recentLogs = data.auditLogs.slice(0, 6);

  return (
    <>
      <PageHeading
        eyebrow="Overview"
        title="Good afternoon, administrator"
        description="A concise view of today’s workplace operations."
        action={<Link className="admin-button primary" to="/admin/reservations">Manage reservations <ArrowRight size={15} /></Link>}
      />

      <section className="admin-stats">
        <StatCard icon={Users} label="Active users" value={activeUsers} note={`${data.users.length - activeUsers} inactive accounts`} />
        <StatCard icon={CalendarCheck} label="Today's reservations" value={todaysReservations} note="Active daily bookings" />
        <StatCard icon={Armchair} label="Active assignments" value={activeAssignments} note="Permanent desk placements" />
        <StatCard icon={Ban} label="Active restrictions" value={activeRestrictions} note="Users currently restricted" />
      </section>

      <section className="admin-grid-two">
        <article className="admin-card">
          <div className="admin-card-header"><div><h3>Recent administrative activity</h3><p>Latest secured actions in the audit trail</p></div><Activity size={18} color="#ff6b00" /></div>
          <div className="admin-activity-list">
            {recentLogs.length === 0 ? <p className="admin-stat-note">No administrative activity yet.</p> : recentLogs.map((log) => (
              <div className="admin-activity" key={log.id}>
                <span className="admin-activity-icon"><UserCheck size={15} /></span>
                <div><strong>{log.action?.replaceAll("_", " ")}</strong><p>{log.targetType} · {log.reason || "No reason provided"}</p></div>
                <time>{new Date(log.createdAt).toLocaleDateString("en-GB")}</time>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-header"><div><h3>Quick actions</h3><p>Jump into frequent admin workflows</p></div></div>
          <div className="admin-quick-list">
            <Link className="admin-quick-link" to="/admin/users">Manage users <ArrowRight size={14} /></Link>
            <Link className="admin-quick-link" to="/admin/reservations">Create reservation <ArrowRight size={14} /></Link>
            <Link className="admin-quick-link" to="/admin/assignments">Assign a desk <ArrowRight size={14} /></Link>
            <Link className="admin-quick-link" to="/admin/restrictions">Apply restriction <ArrowRight size={14} /></Link>
            <Link className="admin-quick-link" to="/admin/desks">Edit desk equipment <ArrowRight size={14} /></Link>
          </div>
        </article>
      </section>
    </>
  );
}

export default AdminDashboard;
