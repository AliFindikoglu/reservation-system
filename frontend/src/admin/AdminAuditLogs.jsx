import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../api/adminApi";
import { EmptyState, ErrorState, LoadingState, PageHeading, StatusPill } from "./AdminUi";

function AdminAuditLogs() {
  const [logs, setLogs] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [query, setQuery] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setLogs(await adminApi.getAuditLogs()); } catch (loadError) { setError(loadError.message); } finally { setLoading(false); } }, []);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  const visible = useMemo(() => logs.filter((log) => `${log.action} ${log.targetType} ${log.reason ?? ""} ${log.adminUser?.fullName ?? ""}`.toLowerCase().includes(query.toLowerCase())), [logs, query]);
  return <>
    <PageHeading eyebrow="Governance" title="Administrative audit log" description="An immutable history of security-sensitive administrative actions." />
    <div className="admin-toolbar"><div className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search action, target or reason" /></div></div>
    <section className="admin-card">{loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : visible.length === 0 ? <EmptyState title="No activity found" description="Administrative actions will appear here." /> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Date</th><th>Administrator</th><th>Action</th><th>Target</th><th>Reason</th></tr></thead><tbody>
      {visible.map((log) => <tr key={log.id}><td>{new Date(log.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td><td><div className="admin-person"><span className="admin-person-avatar">{log.adminUser?.fullName?.[0] ?? "A"}</span><div><strong>{log.adminUser?.fullName ?? "Administrator"}</strong><span>{log.adminUser?.email}</span></div></div></td><td><StatusPill tone="warning">{log.action?.replaceAll("_", " ")}</StatusPill></td><td>{log.targetType}<br /><small>{log.targetId}</small></td><td>{log.reason || "—"}</td></tr>)}
    </tbody></table></div>}</section>
  </>;
}

export default AdminAuditLogs;
