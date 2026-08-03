const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const rawMessage = typeof data === "object" ? data?.message : data;
    const message = Array.isArray(rawMessage)
      ? rawMessage[0]
      : rawMessage || "The operation could not be completed.";
    throw new ApiError(message, response.status, data);
  }

  return data;
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const adminApi = {
  getUsers: (includeInactive = true) =>
    request(`/admin/users?includeInactive=${includeInactive}`),
  updateUserStatus: (id, isActive) =>
    request(`/admin/users/${id}/status`, json("PATCH", { isActive })),
  updateUserRole: (id, role) =>
    request(`/admin/users/${id}/role`, json("PATCH", { role })),

  getReservations: (includeCancelled = true) =>
    request(`/admin/reservations?includeCancelled=${includeCancelled}`),
  previewReservation: (payload) =>
    request("/admin/reservations/preview", json("POST", payload)),
  createReservation: (payload) =>
    request("/admin/reservations", json("POST", payload)),
  previewReservationUpdate: (id, payload) =>
    request(`/admin/reservations/${id}/preview-update`, json("POST", payload)),
  updateReservation: (id, payload) =>
    request(`/admin/reservations/${id}`, json("PATCH", payload)),
  cancelReservation: (id, reason) =>
    request(`/admin/reservations/${id}`, json("DELETE", { reason })),

  getAssignments: (includeRevoked = true) =>
    request(`/admin/table-assignments?includeRevoked=${includeRevoked}`),
  previewAssignment: (payload) =>
    request("/admin/table-assignments/preview", json("POST", payload)),
  createAssignment: (payload) =>
    request("/admin/table-assignments", json("POST", payload)),
  updateAssignmentEndDate: (id, payload) =>
    request(`/admin/table-assignments/${id}/end-date`, json("PATCH", payload)),
  revokeAssignment: (id, reason) =>
    request(`/admin/table-assignments/${id}`, json("DELETE", { reason })),

  getRestrictions: (includeRevoked = true) =>
    request(`/admin/restrictions?includeRevoked=${includeRevoked}`),
  previewRestriction: (payload) =>
    request("/admin/restrictions/preview", json("POST", payload)),
  createRestriction: (payload) =>
    request("/admin/restrictions", json("POST", payload)),
  updateRestriction: (id, payload) =>
    request(`/admin/restrictions/${id}`, json("PATCH", payload)),
  revokeRestriction: (id, reason) =>
    request(`/admin/restrictions/${id}`, json("DELETE", { reason })),

  getAdminTableStatuses: (date) =>
    request(`/admin/tables/statuses?date=${encodeURIComponent(date)}`),
  getTable: (id) => request(`/tables/${id}`),
  getEquipments: () => request("/equipments"),
  createEquipment: (payload) => request("/admin/equipments", json("POST", payload)),
  updateTableEquipments: (id, equipmentIds) =>
    request(`/admin/tables/${id}/equipments`, json("PUT", { equipmentIds })),

  getAuditLogs: () => request("/admin/audit-logs"),
};

