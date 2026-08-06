import { useState } from "react";
import "./LoginModal.css";
import PasswordInput from "../../components/PasswordInput/PasswordInput";

import {
  validateEmail,
  validatePassword,
} from "../../utils/validation";

function LoginModal({
  isOpen,
  onClose,
  onLogin,
  onOpenRegister,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [backendError, setBackendError] = useState("");

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  if (!isOpen) return null;

  async function handleLogin() {
    const validationErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };

    setErrors(validationErrors);

    if (Object.values(validationErrors).some(Boolean)) {
      return;
    }

    try {
      setBackendError("");

      await onLogin({
        email,
        password,
      });
    } catch (err) {
      setBackendError(err.message);
    }
  }

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
            className={errors.email ? "input-error" : ""}
            value={email}
            onChange={(e) => {
              const value = e.target.value.toLowerCase();

              setEmail(value);

              setErrors((prev) => ({
                ...prev,
                email: validateEmail(value),
              }));
            }}
            placeholder="name@eteration.com"
          />

          {errors.email && (
            <p className="field-error">
              {errors.email}
            </p>
          )}
        </div>

        <div className="form-group">
          <label>Password</label>

          <PasswordInput
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);

              setErrors((prev) => ({
                ...prev,
                password: validatePassword(e.target.value),
              }));
            }}
            error={errors.password}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        <button
          className="login-button"
          disabled={!email || !password}
          onClick={handleLogin}
        >
          Login
        </button>

        {backendError && (
          <p className="error-message">
            {backendError}
          </p>
        )}

        <p className="switch-auth">
          Don't have an account?{" "}
          <span onClick={onOpenRegister}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}

export default LoginModal;