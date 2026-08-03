import { Search, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { adminApi } from "../api/adminApi";
import { EmptyState, ErrorState, LoadingState, PageHeading, StatusPill } from "./AdminUi";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setUsers(await adminApi.getUsers(true)); }
    catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesQuery = `${user.fullName} ${user.email}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "all" || (status === "active" ? user.isActive : !user.isActive);
    return matchesQuery && matchesStatus;
  }), [users, query, status]);

  async function toggleStatus(user) {
    const action = user.isActive ? "deactivate" : "activate";
    const result = await Swal.fire({
      title: `${action[0].toUpperCase()}${action.slice(1)} user?`,
      text: user.isActive
        ? "Future reservations will be cancelled and active assignments will be revoked."
        : "The user will be able to sign in again with the same password.",
      icon: "warning", showCancelButton: true, confirmButtonText: `Yes, ${action}`,
      confirmButtonColor: "#ff6b00", cancelButtonColor: "#94a3b8",
    });
    if (!result.isConfirmed) return;
    try { await adminApi.updateUserStatus(user.id, !user.isActive); toast.success(`User ${action}d.`); await load(); }
    catch (actionError) { toast.error(actionError.message); }
  }

  async function changeRole(user, role) {
    if (role === user.role) return;
    const result = await Swal.fire({
      title: "Change account role?", text: `${user.fullName} will become ${role}.`, icon: "question",
      showCancelButton: true, confirmButtonText: "Change role", confirmButtonColor: "#ff6b00",
    });
    if (!result.isConfirmed) return;
    try { await adminApi.updateUserRole(user.id, role); toast.success("User role updated."); await load(); }
    catch (actionError) { toast.error(actionError.message); }
  }

  return (
    <>
      <PageHeading eyebrow="Access control" title="User management" description="Manage account status and administrative access." />
      <div className="admin-toolbar">
        <div className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or company email" /></div>
        <select className="admin-filter" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All accounts</option><option value="active">Active users</option><option value="inactive">Inactive users</option>
        </select>
      </div>
      <section className="admin-card">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : filteredUsers.length === 0 ? (
          <EmptyState title="No users found" description="Try changing your search or status filter." />
        ) : (
          <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr><th>User</th><th>Phone</th><th>Role</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>{filteredUsers.map((user) => <tr key={user.id}>
              <td><div className="admin-person"><span className="admin-person-avatar">{user.fullName?.[0]?.toUpperCase()}</span><div><strong>{user.fullName}</strong><span>{user.email}</span></div></div></td>
              <td>{user.phone}</td>
              <td><select className="admin-filter" value={user.role} onChange={(event) => changeRole(user, event.target.value)}><option value="USER">User</option><option value="ADMIN">Admin</option></select></td>
              <td><StatusPill tone={user.isActive ? "success" : "danger"}>{user.isActive ? "Active" : "Inactive"}</StatusPill></td>
              <td><div className="admin-row-actions">
                <button type="button" className={`admin-icon-action${user.isActive ? " danger" : ""}`} onClick={() => toggleStatus(user)} title={user.isActive ? "Deactivate" : "Activate"}>
                  {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                </button>
                {user.role === "ADMIN" && <span className="admin-icon-action" title="Administrator"><ShieldCheck size={16} /></span>}
              </div></td>
            </tr>)}</tbody>
          </table></div>
        )}
      </section>
    </>
  );
}

export default AdminUsers;
