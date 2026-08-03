import { Edit3, Plus, Search, ShieldOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { adminApi } from "../api/adminApi";
import { EmptyState, ErrorState, FormActions, LoadingState, Modal, PageHeading, StatusPill } from "./AdminUi";
import { formatDate, toDateInput } from "./adminUtils";

const emptyForm = { userId: "", startsOn: toDateInput(), endsOn: toDateInput(), reason: "" };

function AdminRestrictions() {
  const [items, setItems] = useState([]); const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [query, setQuery] = useState(""); const [showRevoked, setShowRevoked] = useState(false);
  const [modal, setModal] = useState(null); const [form, setForm] = useState(emptyForm); const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const [restrictions, userData] = await Promise.all([adminApi.getRestrictions(true), adminApi.getUsers(false)]); setItems(restrictions); setUsers(userData); }
    catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  const visible = useMemo(() => items.filter((item) => `${item.user?.fullName ?? ""} ${item.user?.email ?? ""} ${item.reason ?? ""}`.toLowerCase().includes(query.toLowerCase()) && (showRevoked || !item.revokedAt)), [items, query, showRevoked]);
  function field(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  function openCreate() { setForm(emptyForm); setModal({ mode: "create" }); }
  function openEdit(item) { setForm({ userId: item.userId ?? item.user?.id ?? "", startsOn: item.startsOn?.slice(0,10), endsOn: item.endsOn?.slice(0,10), reason: item.reason ?? "" }); setModal({ mode: "edit", item }); }

  async function submit(event) {
    event.preventDefault(); setBusy(true);
    const createPayload = { userId: form.userId, startsOn: form.startsOn, endsOn: form.endsOn, ...(form.reason.trim() ? { reason: form.reason.trim() } : {}) };
    const updatePayload = { startsOn: form.startsOn, endsOn: form.endsOn, reason: form.reason };
    try {
      if (modal.mode === "create") {
        const preview = await adminApi.previewRestriction(createPayload);
        let confirmed = true;
        if (preview.requiresConfirmation) {
          const count = (preview.impact?.reservations?.length ?? 0) + (preview.impact?.assignments?.length ?? 0);
          const result = await Swal.fire({ title: "Restriction impacts existing records", text: `${count} reservation or assignment record(s) will be cancelled or revoked.`, icon: "warning", showCancelButton: true, confirmButtonText: "Apply restriction", confirmButtonColor: "#dc3535" });
          confirmed = result.isConfirmed;
        }
        if (!confirmed) return;
        await adminApi.createRestriction({ ...createPayload, ...(preview.requiresConfirmation ? { confirmImpact: true } : {}) });
      } else {
        try { await adminApi.updateRestriction(modal.item.id, updatePayload); }
        catch (updateError) {
          if (updateError.status !== 409) throw updateError;
          const result = await Swal.fire({ title: "This update affects existing records", text: updateError.message, icon: "warning", showCancelButton: true, confirmButtonText: "Confirm impact", confirmButtonColor: "#dc3535" });
          if (!result.isConfirmed) return;
          await adminApi.updateRestriction(modal.item.id, { ...updatePayload, confirmImpact: true });
        }
      }
      toast.success(modal.mode === "create" ? "Restriction applied." : "Restriction updated."); setModal(null); await load();
    } catch (submitError) { toast.error(submitError.message); } finally { setBusy(false); }
  }

  async function revoke(item) {
    const result = await Swal.fire({ title: "Remove restriction?", input: "text", inputLabel: "Reason for early removal (optional)", showCancelButton: true, confirmButtonText: "Remove restriction", confirmButtonColor: "#ff6b00" });
    if (!result.isConfirmed) return;
    try { await adminApi.revokeRestriction(item.id, result.value ?? ""); toast.success("Restriction removed."); await load(); }
    catch (actionError) { toast.error(actionError.message); }
  }

  return <>
    <PageHeading eyebrow="Policy controls" title="Restriction management" description="Temporarily prevent reservation activity for a selected user." action={<button type="button" className="admin-button primary" onClick={openCreate}><Plus size={16} /> New restriction</button>} />
    <div className="admin-toolbar"><div className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search user or reason" /></div><label className="admin-equipment-option"><input type="checkbox" checked={showRevoked} onChange={(event) => setShowRevoked(event.target.checked)} /> Show history</label></div>
    <section className="admin-card">{loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : visible.length === 0 ? <EmptyState title="No restrictions found" description="There are no restrictions matching this filter." /> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Period</th><th>Reason</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead><tbody>
      {visible.map((item) => <tr key={item.id}><td><div className="admin-person"><span className="admin-person-avatar">{item.user?.fullName?.[0] ?? "U"}</span><div><strong>{item.user?.fullName ?? "User"}</strong><span>{item.user?.email}</span></div></div></td><td>{formatDate(item.startsOn)} — {formatDate(item.endsOn)}</td><td>{item.reason || "General restriction"}</td><td><StatusPill tone={item.revokedAt ? "neutral" : "danger"}>{item.revokedAt ? "Removed" : "Restricted"}</StatusPill></td><td><div className="admin-row-actions">{!item.revokedAt && <><button type="button" className="admin-icon-action" onClick={() => openEdit(item)} title="Edit"><Edit3 size={15} /></button><button type="button" className="admin-icon-action danger" onClick={() => revoke(item)} title="Remove"><ShieldOff size={15} /></button></>}</div></td></tr>)}
    </tbody></table></div>}</section>
    {modal && <Modal title={modal.mode === "create" ? "Apply user restriction" : "Edit restriction"} description="Reservations in this period may be cancelled and assignments may be revoked." onClose={() => setModal(null)}><form className="admin-form" onSubmit={submit}><div className="admin-form-grid">
      {modal.mode === "create" && <div className="admin-field full"><label>User</label><select required name="userId" value={form.userId} onChange={field}><option value="">Select a user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName} · {user.email}</option>)}</select></div>}
      <div className="admin-field"><label>Start date</label><input required type="date" name="startsOn" value={form.startsOn} onChange={field} /></div><div className="admin-field"><label>End date</label><input required type="date" name="endsOn" value={form.endsOn} onChange={field} /></div>
      <div className="admin-field full"><label>Reason (optional)</label><textarea name="reason" value={form.reason} onChange={field} placeholder="This message will be visible to the user" /></div>
    </div><FormActions onCancel={() => setModal(null)} submitLabel={modal.mode === "create" ? "Preview & apply" : "Update restriction"} busy={busy} /></form></Modal>}
  </>;
}

export default AdminRestrictions;
