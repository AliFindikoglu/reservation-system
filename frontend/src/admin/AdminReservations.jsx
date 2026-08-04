import { CalendarDays, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { adminApi } from "../api/adminApi";
import { EmptyState, ErrorState, FormActions, LoadingState, Modal, PageHeading, StatusPill } from "./AdminUi";
import { formatDate, toDateInput } from "./adminUtils";

const emptyForm = { userId: "", tableNumber: "", reservationDate: toDateInput(), reason: "", replacementTableNumber: "" };

function conflictCount(preview) {
  if (Array.isArray(preview?.conflicts)) return preview.conflicts.length;
  return (preview?.conflicts?.reservations?.length ?? 0) + (preview?.conflicts?.assignments?.length ?? 0);
}

function confirmationText(preview) {
  const base = `${conflictCount(preview)} existing record(s) may be changed or cancelled.`;
  if (!preview?.replacement) return base;
  return `${base} ${preview.replacement.displacedUser.fullName} will be moved to desk ${preview.replacement.table.code}.`;
}

function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("active");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [reservationData, userData] = await Promise.all([adminApi.getReservations(true), adminApi.getUsers(false)]);
      setReservations(reservationData); setUsers(userData);
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  const visibleReservations = useMemo(() => reservations.filter((item) => {
    const haystack = `${item.user?.fullName ?? ""} ${item.user?.email ?? ""} ${item.table?.code ?? item.table?.number ?? ""}`.toLowerCase();
    const matchesFilter = filter === "all" || (filter === "active" ? !item.isCancelled : item.isCancelled);
    const reservationDate = item.reservationDate?.slice(0, 10) ?? "";
    const matchesStart = !dateFrom || reservationDate >= dateFrom;
    const matchesEnd = !dateTo || reservationDate <= dateTo;
    return haystack.includes(query.toLowerCase()) && matchesFilter && matchesStart && matchesEnd;
  }), [reservations, query, filter, dateFrom, dateTo]);

  const hasDateFilter = Boolean(dateFrom || dateTo);
  function clearDateFilter() { setDateFrom(""); setDateTo(""); }

  function openCreate() { setForm(emptyForm); setModal({ mode: "create" }); }
  function openEdit(item) {
    setForm({ userId: item.userId ?? item.user?.id ?? "", tableNumber: String(item.table?.number ?? ""), reservationDate: item.reservationDate?.slice(0, 10) ?? toDateInput(), reason: "", replacementTableNumber: "" });
    setModal({ mode: "edit", item });
  }
  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function submit(event) {
    event.preventDefault(); setBusy(true);
    const payload = {
      userId: form.userId,
      tableNumber: Number(form.tableNumber),
      reservationDate: form.reservationDate,
      ...(form.reason.trim() ? { reason: form.reason.trim() } : {}),
      ...(form.replacementTableNumber ? { replacementTableNumber: Number(form.replacementTableNumber) } : {}),
    };
    try {
      const preview = modal.mode === "edit"
        ? await adminApi.previewReservationUpdate(modal.item.id, payload)
        : await adminApi.previewReservation(payload);
      let confirmed = true;
      if (preview.requiresConfirmation) {
        const result = await Swal.fire({
          title: "Conflicts detected", text: confirmationText(preview),
          icon: "warning", showCancelButton: true, confirmButtonText: "Review accepted, continue", confirmButtonColor: "#ff6b00",
        });
        confirmed = result.isConfirmed;
      }
      if (!confirmed) return;
      const finalPayload = { ...payload, ...(preview.requiresConfirmation ? { confirmOverride: true } : {}) };
      if (modal.mode === "edit") await adminApi.updateReservation(modal.item.id, finalPayload);
      else await adminApi.createReservation(finalPayload);
      toast.success(modal.mode === "edit" ? "Reservation updated." : "Reservation created.");
      setModal(null); await load();
    } catch (submitError) { toast.error(submitError.message); }
    finally { setBusy(false); }
  }

  async function cancel(item) {
    const result = await Swal.fire({ title: "Cancel reservation?", input: "text", inputLabel: "Cancellation reason (optional)", showCancelButton: true, confirmButtonText: "Cancel reservation", confirmButtonColor: "#dc3535" });
    if (!result.isConfirmed) return;
    try { await adminApi.cancelReservation(item.id, result.value ?? ""); toast.success("Reservation cancelled."); await load(); }
    catch (cancelError) { toast.error(cancelError.message); }
  }

  return (
    <>
      <PageHeading eyebrow="Daily bookings" title="Reservation management" description="Create, relocate and cancel reservations across the workplace." action={<button type="button" className="admin-button primary" onClick={openCreate}><Plus size={16} /> New reservation</button>} />
      <div className="admin-toolbar">
        <div className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by user or desk" /></div>
        <label className="admin-date-filter"><CalendarDays size={15} /><span>From</span><input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></label>
        <label className="admin-date-filter"><span>To</span><input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label>
        <select className="admin-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="active">Active</option><option value="cancelled">Cancelled</option><option value="all">All reservations</option></select>
        {hasDateFilter && <button type="button" className="admin-icon-action" title="Clear date filter" onClick={clearDateFilter}><X size={15} /></button>}
      </div>
      <div className="admin-result-summary">Showing <strong>{visibleReservations.length}</strong> of {reservations.length} reservations{hasDateFilter ? " in the selected date range" : ""}.</div>
      <section className="admin-card">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : visibleReservations.length === 0 ? <EmptyState title="No reservations found" description="Create a reservation or change the current filters." /> : (
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Desk</th><th>Date</th><th>Source</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
          <tbody>{visibleReservations.map((item) => <tr key={item.id}>
            <td><div className="admin-person"><span className="admin-person-avatar">{item.user?.fullName?.[0] ?? "U"}</span><div><strong>{item.user?.fullName}</strong><span>{item.user?.email}</span></div></div></td>
            <td><strong>{item.table?.code ?? `Desk ${item.table?.number}`}</strong></td><td>{formatDate(item.reservationDate)}</td>
            <td><StatusPill tone={item.createdByAdminId ? "warning" : "neutral"}>{item.createdByAdminId ? "Admin" : "User"}</StatusPill></td>
            <td><StatusPill tone={item.isCancelled ? "danger" : "success"}>{item.isCancelled ? "Cancelled" : "Active"}</StatusPill></td>
            <td><div className="admin-row-actions">{!item.isCancelled && <><button type="button" className="admin-icon-action" onClick={() => openEdit(item)} title="Edit"><Edit3 size={15} /></button><button type="button" className="admin-icon-action danger" onClick={() => cancel(item)} title="Cancel"><Trash2 size={15} /></button></>}</div></td>
          </tr>)}</tbody></table></div>
        )}
      </section>

      {modal && <Modal title={modal.mode === "edit" ? "Edit reservation" : "Create reservation"} description="The impact will be previewed before changes are applied." onClose={() => setModal(null)}>
        <form className="admin-form" onSubmit={submit}><div className="admin-form-grid">
          <div className="admin-field full"><label>User</label><select required name="userId" value={form.userId} onChange={updateField}><option value="">Select a user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName} · {user.email}</option>)}</select></div>
          <div className="admin-field"><label>Desk number</label><input required min="1" max="32" type="number" name="tableNumber" value={form.tableNumber} onChange={updateField} /></div>
          <div className="admin-field"><label>Reservation date</label><input required type="date" name="reservationDate" value={form.reservationDate} onChange={updateField} /></div>
          {modal.mode === "create" && <div className="admin-field"><label>Replacement desk (optional)</label><input min="1" max="32" type="number" name="replacementTableNumber" value={form.replacementTableNumber} onChange={updateField} /><small>Used to relocate the current occupant of the target desk.</small></div>}
          <div className="admin-field full"><label>Reason (optional)</label><textarea name="reason" value={form.reason} onChange={updateField} placeholder="Add operational context for the audit trail" /></div>
        </div><FormActions onCancel={() => setModal(null)} submitLabel={modal.mode === "edit" ? "Preview update" : "Preview & create"} busy={busy} /></form>
      </Modal>}
    </>
  );
}

export default AdminReservations;
