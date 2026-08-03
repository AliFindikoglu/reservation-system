import { CalendarDays, MonitorCog, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminApi } from "../api/adminApi";
import { ErrorState, LoadingState, Modal, PageHeading } from "./AdminUi";
import { toDateInput } from "./adminUtils";

function AdminDesks() {
  const [date, setDate] = useState(toDateInput());
  const [tables, setTables] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [statusData, equipmentData] = await Promise.all([adminApi.getAdminTableStatuses(date), adminApi.getEquipments()]);
      setTables(statusData.tables); setEquipments(equipmentData.equipments);
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, [date]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  function editDesk(table) {
    setSelected(table);
    setSelectedEquipmentIds(table.equipments?.map((equipment) => equipment.id) ?? []);
  }
  function toggleEquipment(id) {
    setSelectedEquipmentIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  async function saveEquipments(event) {
    event.preventDefault(); setSaving(true);
    try { await adminApi.updateTableEquipments(selected.id, selectedEquipmentIds); toast.success(`${selected.code} equipment updated.`); setSelected(null); await load(); }
    catch (saveError) { toast.error(saveError.message); } finally { setSaving(false); }
  }

  return <>
    <PageHeading eyebrow="Floor operations" title="Desk management" description="Inspect daily occupancy and maintain equipment inventories." action={<label className="admin-button secondary"><CalendarDays size={16} /><input style={{ border: 0, outline: 0 }} type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>} />
    <div className="admin-toolbar"><div className="admin-desk-legend"><span><i style={{ background: "#a2a8af" }} /> Available</span><span><i style={{ background: "#d75a5a" }} /> Reserved</span><span><i style={{ background: "#ff8a38" }} /> Admin reserved</span><span><i style={{ background: "#5686c7" }} /> Assigned</span></div></div>
    <section className="admin-card">
      <div className="admin-card-header"><div><h3>ITU-ARI3 floor plan</h3><p>Select a desk to inspect its occupant and equipment</p></div><MonitorCog size={19} color="#ff6b00" /></div>
      {loading ? <LoadingState label="Loading floor plan..." /> : error ? <ErrorState message={error} onRetry={load} /> : <div className="admin-desk-grid">
        {tables.map((table) => <button type="button" key={table.id} className={`admin-desk ${table.status}`} onClick={() => editDesk(table)} title={table.occupant?.fullName ?? "Available desk"}>
          <strong>{table.code}</strong><small>{table.status.replaceAll("_", " ")}</small>
        </button>)}
      </div>}
    </section>
    {selected && <Modal title={`Desk ${selected.code}`} description={selected.occupant ? `Currently used by ${selected.occupant.fullName}` : "This desk is available for the selected date."} onClose={() => setSelected(null)}>
      <form className="admin-form" onSubmit={saveEquipments}>
        {selected.underlyingAssignment && <div className="admin-conflicts"><strong>Underlying permanent assignment</strong><p>{selected.underlyingAssignment.user?.fullName} · {selected.underlyingAssignment.startsOn} — {selected.underlyingAssignment.endsOn ?? "Indefinite"}</p></div>}
        <div className="admin-field full" style={{ marginTop: 16 }}><label>Equipment inventory</label><div className="admin-equipment-list">
          {equipments.map((equipment) => <label className="admin-equipment-option" key={equipment.id}><input type="checkbox" checked={selectedEquipmentIds.includes(equipment.id)} onChange={() => toggleEquipment(equipment.id)} /> {equipment.name}</label>)}
        </div></div>
        <div className="admin-form-actions"><button type="button" className="admin-button secondary" onClick={() => setSelected(null)}>Cancel</button><button type="submit" className="admin-button primary" disabled={saving}><Save size={15} /> {saving ? "Saving..." : "Save equipment"}</button></div>
      </form>
    </Modal>}
  </>;
}

export default AdminDesks;
