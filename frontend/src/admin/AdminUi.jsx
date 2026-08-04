import { AlertCircle, X } from "lucide-react";

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="admin-page-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading data..." }) {
  return <div className="admin-state"><span className="admin-spinner" /><p>{label}</p></div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="admin-state admin-state-error">
      <AlertCircle size={30} />
      <strong>Something went wrong</strong>
      <p>{message}</p>
      {onRetry && <button type="button" className="admin-button secondary" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, description }) {
  return <div className="admin-state"><AlertCircle size={30} /><strong>{title}</strong><p>{description}</p></div>;
}

export function Modal({ title, description, children, onClose, wide = false }) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`admin-modal${wide ? " wide" : ""}`}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div><h3>{title}</h3>{description && <p>{description}</p>}</div>
          <button type="button" onClick={onClose} ><X size={20} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function StatusPill({ children, tone = "neutral" }) {
  return <span className={`admin-pill ${tone}`}>{children}</span>;
}

export function FormActions({ onCancel, submitLabel, busy }) {
  return (
    <div className="admin-form-actions">
      <button type="button" className="admin-button secondary" onClick={onCancel}>Cancel</button>
      <button type="submit" className="admin-button primary" disabled={busy}>
        {busy ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
