import { useState } from "react";
import "./RegisterModal.css";

function RegisterModal({ isOpen, onRegister, onClose, onOpenLogin, }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleRegister() {
  try {
    setError("");

    await onRegister({
      fullName,
      email,
      phone,
      password,
    });
  } catch (err) {
    setError(err.message);
  }
}

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e)=> e.stopPropagation()}>
        <button
  className="close-button"
  onClick={onClose}
>
  ✕
</button>
        <h2>Create Account</h2>
        <p>Create your Eteration account.</p>

        <div className="form-group">
          <label>Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Damla Nur Sert"
          />
        </div>

        <div className="form-group">
          <label>Work Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            placeholder="name@eteration.com"
          />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+905551112233"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>

        <button
          className="login-button"
          disabled={!fullName || !email || !phone || !password}
          onClick={handleRegister}
        >
          Register
        </button>
        {error && (
  <p className="error-message">
    {error}
  </p>
)}
        <p className="switch-auth">
  Already have an account?{" "}
  <span onClick={onOpenLogin}>Login</span>
</p>
      </div>
    </div>
  );
}

export default RegisterModal;