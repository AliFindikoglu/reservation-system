import { Armchair, Ban, CalendarCheck, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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

function DonutChart({ value, total, label, color = "#ff6b00" }) {
  const percentage = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="admin-donut-block">
      <div
        className="admin-donut"
        style={{ "--donut-angle": `${percentage * 3.6}deg`, "--donut-color": color }}
        aria-label={`${label}: ${percentage}%`}
      >
        <span>{percentage}%</span>
      </div>
      <div><strong>{label}</strong><p>{value} of {total}</p></div>
    </div>
  );
}

function ReservationChart({ reservations }) {
  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - (6 - index));
      const key = toDateInput(date);
      const matching = reservations.filter((item) => item.reservationDate?.slice(0, 10) === key);
      return {
        key,
        label: date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
        active: matching.filter((item) => !item.isCancelled).length,
        cancelled: matching.filter((item) => item.isCancelled).length,
      };
    });
    const maximum = Math.max(1, ...days.map((day) => day.active + day.cancelled));
    return { days, maximum };
  }, [reservations]);

  return (
    <article className="admin-card admin-chart-card">
      <div className="admin-card-header">
        <div><h3>Reservation volume</h3><p>Active and cancelled reservations over the last seven days</p></div>
        <div className="admin-chart-legend"><span><i className="active" /> Active</span><span><i className="cancelled" /> Cancelled</span></div>
      </div>
      <div className="admin-bar-chart">
        {chartData.days.map((day) => (
          <div className="admin-bar-column" key={day.key} title={`${day.active} active, ${day.cancelled} cancelled`}>
            <div className="admin-bar-value">{day.active + day.cancelled}</div>
            <div className="admin-bar-track">
              <div className="admin-bar-segment cancelled" style={{ height: `${(day.cancelled / chartData.maximum) * 100}%` }} />
              <div className="admin-bar-segment active" style={{ height: `${(day.active / chartData.maximum) * 100}%` }} />
            </div>
            <span>{day.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [users, reservations, assignments, restrictions] = await Promise.all([
        adminApi.getUsers(true),
        adminApi.getReservations(true),
        adminApi.getAssignments(true),
        adminApi.getRestrictions(true),
      ]);
      setData({ users, reservations, assignments, restrictions });
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState label="Loading admin overview..." />;

  const today = toDateInput();
  const activeUsers = data.users.filter((user) => user.isActive).length;
  const todaysReservationItems = data.reservations.filter(
    (item) => !item.isCancelled && item.reservationDate?.slice(0, 10) === today,
  );
  const todaysReservations = todaysReservationItems.length;
  const todaysAssignments = data.assignments.filter(
    (item) => !item.revokedAt && item.startsOn?.slice(0, 10) <= today && (!item.endsOn || item.endsOn.slice(0, 10) >= today),
  );
  const activeAssignments = data.assignments.filter((item) => !item.revokedAt).length;
  const activeRestrictions = data.restrictions.filter(
    (item) => !item.revokedAt && item.startsOn?.slice(0, 10) <= today && item.endsOn?.slice(0, 10) >= today,
  ).length;
  const occupiedTableIds = new Set([
    ...todaysReservationItems.map((item) => item.tableId ?? item.table?.id),
    ...todaysAssignments.map((item) => item.tableId ?? item.table?.id),
  ].filter(Boolean));
  const adminReservations = data.reservations.filter((item) => !item.isCancelled && item.createdByAdminId).length;
  const activeReservations = data.reservations.filter((item) => !item.isCancelled).length;

  return (
    <>
      <PageHeading
        eyebrow="Overview"
        title="Good afternoon, administrator"
        description="Live workplace utilization and reservation trends."
      />

      <section className="admin-stats">
        <StatCard icon={Users} label="Active users" value={activeUsers} note={`${data.users.length - activeUsers} inactive accounts`} />
        <StatCard icon={CalendarCheck} label="Today's reservations" value={todaysReservations} note="Active daily bookings" />
        <StatCard icon={Armchair} label="Active assignments" value={activeAssignments} note="Permanent desk placements" />
        <StatCard icon={Ban} label="Active restrictions" value={activeRestrictions} note="Users currently restricted" />
      </section>

      <section className="admin-dashboard-charts">
        <ReservationChart reservations={data.reservations} />
        <article className="admin-card admin-donut-card">
          <div className="admin-card-header"><div><h3>Operational distribution</h3><p>Today’s occupancy and reservation sources</p></div></div>
          <div className="admin-donut-list">
            <DonutChart value={occupiedTableIds.size} total={32} label="Desk utilization" />
            <DonutChart value={activeUsers} total={data.users.length} label="Active accounts" color="#3f7bea" />
            <DonutChart value={adminReservations} total={activeReservations} label="Admin-created bookings" color="#8b5cf6" />
          </div>
        </article>
      </section>
    </>
  );
}

export default AdminDashboard;
