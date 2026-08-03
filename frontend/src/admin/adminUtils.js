export const toDateInput = (date = new Date()) => date.toISOString().slice(0, 10);

export function formatDate(value) {
  if (!value) return "Indefinite";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

export function getErrorMessage(error) {
  return error?.message || "The operation could not be completed.";
}
