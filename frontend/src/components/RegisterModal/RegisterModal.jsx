import { useState } from "react";
import "./RegisterModal.css";

function RegisterModal({ isOpen, onRegister }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
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
          onClick={() =>
            onRegister({
              fullName,
              email,
              phone,
              password,
            })
          }
        >
          Register
        </button>
      </div>
    </div>
  );
}

export default RegisterModal;