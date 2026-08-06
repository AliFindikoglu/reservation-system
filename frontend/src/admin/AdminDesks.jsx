import { CalendarDays, MonitorCog, Plus, Save, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { adminApi } from "../api/adminApi";
import SeatGrid from "../components/SeatGrid/SeatGrid";
import { ErrorState, LoadingState, Modal, PageHeading } from "./AdminUi";
import { toDateInput } from "./adminUtils";

const emptyEquipment = { name: "", code: "" };
const EXCLUSIVE_EQUIPMENT_GROUPS = {
  MONITOR: "MONITOR_SETUP",
  DUAL_MONITOR: "MONITOR_SETUP",
};

function normalizeCode(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function equipmentGroup(equipment) {
  return EXCLUSIVE_EQUIPMENT_GROUPS[equipment.code] ?? null;
}

function AdminDesks() {
  const [date, setDate] = useState(toDateInput());
  const [tables, setTables] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showNewEquipment, setShowNewEquipment] = useState(false);
  const [newEquipment, setNewEquipment] = useState(emptyEquipment);
  const [creatingEquipment, setCreatingEquipment] = useState(false);
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState("");

  useEffect(() => {
    adminApi.getOffices()
      .then((items) => {
        setOffices(items);
        const istanbul = items.find((office) => office.city.toLowerCase() === "istanbul");
        setSelectedOfficeId((istanbul ?? items[0])?.id ?? "");
      })
      .catch((loadError) => setError(loadError.message));
  }, []);

  const load = useCallback(async () => {
    if (!selectedOfficeId) return;
    setLoading(true); setError("");
    try {
      const [statusData, equipmentData] = await Promise.all([
        adminApi.getAdminTableStatuses(selectedOfficeId, date),
        adminApi.getEquipments(),
      ]);
      setTables(statusData.tables);
      setEquipments(equipmentData.equipments);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [date, selectedOfficeId]);

  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  function editDeskByNumber(tableNumber) {
    const table = tables.find((item) => item.number === tableNumber);
    if (!table) return;
    setSelected(table);
    setSelectedEquipmentIds(table.equipments?.map((equipment) => equipment.id) ?? []);
    setShowNewEquipment(false);
    setNewEquipment(emptyEquipment);
  }

  function toggleEquipment(equipment) {
    setSelectedEquipmentIds((current) => {
      if (current.includes(equipment.id)) return current.filter((item) => item !== equipment.id);
      const exclusiveGroup = equipmentGroup(equipment);
      if (!exclusiveGroup) return [...current, equipment.id];
      const sameGroupIds = new Set(
        equipments.filter((item) => equipmentGroup(item) === exclusiveGroup).map((item) => item.id),
      );
      return [...current.filter((item) => !sameGroupIds.has(item)), equipment.id];
    });
  }

  async function saveEquipments(event) {
    event.preventDefault(); setSaving(true);
    try {
      await adminApi.updateTableEquipments(selected.id, selectedOfficeId, selectedEquipmentIds);
      toast.success(`${selected.code} equipment updated.`);
      setSelected(null);
      await load();
    } catch (saveError) {
      toast.error(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function createEquipmentType() {
    if (!newEquipment.name.trim() || !newEquipment.code.trim()) {
      toast.error("Equipment name and code are required.");
      return;
    }
    setCreatingEquipment(true);
    try {
      const created = await adminApi.createEquipment({
        name: newEquipment.name.trim(),
        code: normalizeCode(newEquipment.code),
      });
      setEquipments((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedEquipmentIds((current) => {
        const exclusiveGroup = equipmentGroup(created);
        if (!exclusiveGroup) return [...current, created.id];
        const conflictingIds = new Set(
          equipments.filter((item) => equipmentGroup(item) === exclusiveGroup).map((item) => item.id),
        );
        return [...current.filter((item) => !conflictingIds.has(item)), created.id];
      });
      setNewEquipment(emptyEquipment);
      setShowNewEquipment(false);
      toast.success("Equipment type created and selected.");
    } catch (createError) {
      toast.error(createError.message);
    } finally {
      setCreatingEquipment(false);
    }
  }

  async function deleteEquipmentType(equipment) {
    const result = await Swal.fire({
      title: `Delete ${equipment.name}?`,
      text: "This equipment type will be removed from every desk.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete equipment",
      confirmButtonColor: "#dc3535",
    });
    if (!result.isConfirmed) return;
    try {
      await adminApi.deleteEquipment(equipment.id);
      setEquipments((current) => current.filter((item) => item.id !== equipment.id));
      setSelectedEquipmentIds((current) => current.filter((id) => id !== equipment.id));
      toast.success("Equipment type deleted.");
    } catch (deleteError) {
      toast.error(deleteError.message);
    }
  }

  const selectedOffice = offices.find((office) => office.id === selectedOfficeId);

  return (
    <>
      <PageHeading
        eyebrow="Floor operations"
        title="Desk management"
        description="Inspect daily occupancy and maintain equipment inventories."
        action={<div className="admin-heading-actions"><select className="admin-filter" value={selectedOfficeId} onChange={(event) => { setSelectedOfficeId(event.target.value); setSelected(null); }}>{offices.map((office) => <option key={office.id} value={office.id}>{office.city}</option>)}</select><label className="admin-button secondary"><CalendarDays size={16} /><input className="admin-inline-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label></div>}
      />
      <div className="admin-toolbar"><div className="admin-desk-legend"><span><i style={{ background: "#0ae90a" }} /> Available</span><span><i style={{ background: "#908e8e" }} /> Reserved</span><span><i style={{ background: "#8b5cf6" }} /> Admin reserved</span></div></div>
      <section className="admin-card admin-office-plan">
        <div className="admin-card-header"><div><h3>{selectedOffice?.name ?? "Office"} floor plan</h3><p>Select a desk to inspect its occupant and equipment</p></div><MonitorCog size={19} color="#ff6b00" /></div>
        {loading ? <LoadingState label="Loading floor plan..." /> : error ? <ErrorState message={error} onRetry={load} /> : (
          <SeatGrid
            tableStatuses={tables}
            selectedSeat={selected?.number ?? null}
            onSeatClick={editDeskByNumber}
            adminMode
            tableCount={tables.length}
          />
        )}
      </section>

      {selected && (
        <Modal
          title={`Desk ${selected.code}`}
          description={selected.occupant ? `Currently used by ${selected.occupant.fullName}` : "This desk is available for the selected date."}
          onClose={() => setSelected(null)}
        >
          <form className="admin-form" onSubmit={saveEquipments}>
            {selected.underlyingAssignment && <div className="admin-conflicts"><strong>Underlying permanent assignment</strong><p>{selected.underlyingAssignment.user?.fullName} · {selected.underlyingAssignment.startsOn} — {selected.underlyingAssignment.endsOn ?? "Indefinite"}</p></div>}

            <div className="admin-equipment-heading">
              <div><strong>Equipment inventory</strong><span>Options in the same group are mutually exclusive.</span></div>
              <button type="button" className="admin-button secondary" onClick={() => setShowNewEquipment((current) => !current)}>
                {showNewEquipment ? <X size={14} /> : <Plus size={14} />} {showNewEquipment ? "Close" : "New type"}
              </button>
            </div>

            {showNewEquipment && (
              <div className="admin-new-equipment">
                <div className="admin-field"><label>Name</label><input value={newEquipment.name} onChange={(event) => setNewEquipment((current) => ({ ...current, name: event.target.value, code: current.code || normalizeCode(event.target.value) }))} placeholder="Standing Desk Converter" /></div>
                <div className="admin-field"><label>Code</label><input value={newEquipment.code} onChange={(event) => setNewEquipment((current) => ({ ...current, code: normalizeCode(event.target.value) }))} placeholder="STANDING_DESK_CONVERTER" /></div>
                <button type="button" className="admin-button primary" disabled={creatingEquipment} onClick={createEquipmentType}>{creatingEquipment ? "Creating..." : "Create type"}</button>
              </div>
            )}

            <div className="admin-equipment-list">
              {equipments.map((equipment) => {
                const exclusiveGroup = equipmentGroup(equipment);
                return (
                  <div className={`admin-equipment-option ${selectedEquipmentIds.includes(equipment.id) ? "selected" : ""}`} key={equipment.id}>
                    <label className="admin-equipment-choice">
                      <input type="checkbox" checked={selectedEquipmentIds.includes(equipment.id)} onChange={() => toggleEquipment(equipment)} />
                      <span>{equipment.name}{exclusiveGroup && <small>Choose one · monitor setup</small>}</span>
                    </label>
                    <button type="button" className="admin-equipment-delete" title={`Delete ${equipment.name}`} onClick={() => deleteEquipmentType(equipment)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="admin-form-actions"><button type="button" className="admin-button secondary" onClick={() => setSelected(null)}>Cancel</button><button type="submit" className="admin-button primary" disabled={saving}><Save size={15} /> {saving ? "Saving..." : "Save equipment"}</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}

export default AdminDesks;
