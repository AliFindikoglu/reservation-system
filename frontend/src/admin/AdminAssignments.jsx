import { Edit3, Plus, Search, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { adminApi } from "../api/adminApi";
import { EmptyState, ErrorState, FormActions, LoadingState, Modal, PageHeading, StatusPill } from "./AdminUi";
import { formatDate, toDateInput } from "./adminUtils";

const emptyForm = { userId: "", tableNumber: "", startsOn: toDateInput(), endsOn: "", reason: "" };

function AdminAssignments() {
  const [items, setItems] = useState([]); const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [query, setQuery] = useState(""); const [showRevoked, setShowRevoked] = useState(false);
  const [open, setOpen] = useState(false); const [form, setForm] = useState(emptyForm); const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const [assignments, userData] = await Promise.all([adminApi.getAssignments(true), adminApi.getUsers(false)]); setItems(assignments); setUsers(userData); }
    catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  const visible = useMemo(() => items.filter((item) => {
    const matches = `${item.user?.fullName ?? ""} ${item.user?.email ?? ""} ${item.table?.code ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matches && (showRevoked || !item.revokedAt);
  }), [items, query, showRevoked]);

  function field(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    const payload = { userId: form.userId, tableNumber: Number(form.tableNumber), startsOn: form.startsOn, endsOn: form.endsOn || null, ...(form.reason.trim() ? { reason: form.reason.trim() } : {}) };
    try {
      const preview = await adminApi.previewAssignment(payload);
      let confirmed = true;
      if (preview.requiresConfirmation) {
        const count = (preview.conflicts?.assignments?.length ?? 0) + (preview.conflicts?.reservations?.length ?? 0);
        const result = await Swal.fire({ title: "Assignment conflicts detected", text: `${count} record(s) may be affected.`, icon: "warning", showCancelButton: true, confirmButtonText: "Confirm override", confirmButtonColor: "#ff6b00" });
        confirmed = result.isConfirmed;
      }
      if (!confirmed) return;
      await adminApi.createAssignment({ ...payload, ...(preview.requiresConfirmation ? { confirmOverride: true } : {}) });
      toast.success("Desk assignment created."); setOpen(false); setForm(emptyForm); await load();
    } catch (submitError) { toast.error(submitError.message); } finally { setBusy(false); }
  }

  async function updateEndDate(item) {
    const result = await Swal.fire({ title: "Update assignment end date", input: "date", inputValue: item.endsOn?.slice(0, 10) ?? "", inputLabel: "Leave the date empty for an indefinite assignment", showCancelButton: true, confirmButtonText: "Update", confirmButtonColor: "#ff6b00" });
    if (!result.isConfirmed) return;
    try { await adminApi.updateAssignmentEndDate(item.id, { endsOn: result.value || null }); toast.success("Assignment end date updated."); await load(); }
    catch (actionError) {
      if (actionError.status === 409) toast.error("The new period conflicts with another record. Review the assignment before overriding.");
      else toast.error(actionError.message);
    }
  }

  async function revoke(item) {
    const result = await Swal.fire({ title: "End this assignment?", input: "text", inputLabel: "Revocation reason (optional)", icon: "warning", showCancelButton: true, confirmButtonText: "End assignment", confirmButtonColor: "#dc3535" });
    if (!result.isConfirmed) return;
    try { await adminApi.revokeAssignment(item.id, result.value ?? ""); toast.success("Assignment ended."); await load(); }
    catch (actionError) { toast.error(actionError.message); }
  }

  return <>
    <PageHeading eyebrow="Long-term seating" title="Permanent assignments" description="Reserve a desk for a user across an inclusive date range." action={<button type="button" className="admin-button primary" onClick={() => setOpen(true)}><Plus size={16} /> New assignment</button>} />
    <div className="admin-toolbar"><div className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search user or desk" /></div><label className="admin-equipment-option"><input type="checkbox" checked={showRevoked} onChange={(event) => setShowRevoked(event.target.checked)} /> Show revoked</label></div>
    <section className="admin-card">{loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : visible.length === 0 ? <EmptyState title="No assignments found" description="Create the first long-term desk assignment." /> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Desk</th><th>Starts</th><th>Ends</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead><tbody>
      {visible.map((item) => <tr key={item.id}><td><div className="admin-person"><span className="admin-person-avatar">{item.user?.fullName?.[0] ?? "U"}</span><div><strong>{item.user?.fullName}</strong><span>{item.user?.email}</span></div></div></td><td><strong>{item.table?.code ?? item.table?.number}</strong></td><td>{formatDate(item.startsOn)}</td><td>{formatDate(item.endsOn)}</td><td><StatusPill tone={item.revokedAt ? "danger" : "info"}>{item.revokedAt ? "Revoked" : "Assigned"}</StatusPill></td><td><div className="admin-row-actions">{!item.revokedAt && <><button type="button" className="admin-icon-action" onClick={() => updateEndDate(item)} title="Update end date"><Edit3 size={15} /></button><button type="button" className="admin-icon-action danger" onClick={() => revoke(item)} title="End assignment"><XCircle size={15} /></button></>}</div></td></tr>)}
    </tbody></table></div>}</section>
    {open && <Modal title="Create permanent assignment" description="Assignments take priority over normal user reservations." onClose={() => setOpen(false)}><form className="admin-form" onSubmit={submit}><div className="admin-form-grid">
      <div className="admin-field full"><label>User</label><select required name="userId" value={form.userId} onChange={field}><option value="">Select a user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName} · {user.email}</option>)}</select></div>
      <div className="admin-field"><label>Desk number</label><input required min="1" max="32" type="number" name="tableNumber" value={form.tableNumber} onChange={field} /></div>
      <div className="admin-field"><label>Start date</label><input required type="date" name="startsOn" value={form.startsOn} onChange={field} /></div>
      <div className="admin-field"><label>End date</label><input type="date" name="endsOn" value={form.endsOn} onChange={field} /><small>Leave empty for an indefinite assignment.</small></div>
      <div className="admin-field full"><label>Reason (optional)</label><textarea name="reason" value={form.reason} onChange={field} /></div>
    </div><FormActions onCancel={() => setOpen(false)} submitLabel="Preview & assign" busy={busy} /></form></Modal>}
  </>;
}

export default AdminAssignments;
