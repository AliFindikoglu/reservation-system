import { useState } from "react";
import "./LoginModal.css";

function LoginModal({
  isOpen,
  onClose,
  onLogin,
  onOpenRegister,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
  try {
    setError("");

    await onLogin({
      email,
      password,
    });
  } catch (err) {
    setError(err.message);
  }
}

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close-button"
          onClick={onClose}
        >
          ✕
        </button>

        <h2>Welcome</h2>
        <p>Please sign in to continue.</p>

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
  disabled={!email || !password}
  onClick={handleLogin}
>
  Login
</button>
{error && <p className="error-message">{error}</p>}


        <p className="switch-auth">
          Don't have an account?{" "}
          <span onClick={onOpenRegister}>Register</span>
        </p>
      </div>
    </div>
  );
}

export default LoginModal;