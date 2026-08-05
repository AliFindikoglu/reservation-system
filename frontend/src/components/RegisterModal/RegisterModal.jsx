import { useState } from "react";
import toast from "react-hot-toast";
import "./RegisterModal.css";
import PasswordInput from "../../components/PasswordInput/PasswordInput";

import {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  formatName,
} from "../../utils/validation";

function RegisterModal({
  isOpen,
  onRegister,
  onClose,
  onOpenLogin,
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  if (!isOpen) return null;

  async function handleRegister() {
    const validationErrors = {
      firstName: validateName(firstName),
      lastName: validateName(lastName),
      email: validateEmail(email),
      phone: validatePhone(phone),
      password: validatePassword(password),
    };

    setErrors(validationErrors);

    if (Object.values(validationErrors).some(Boolean)) {
      return;
    }

    try {
      await onRegister({

        fullName: `${firstName.trim()} ${lastName.trim()}`,
        email,
        phone,
        password,
      });
    } catch (err) {
      toast.error(err.message || "Registration failed.");
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

        <h2>Create Account</h2>
        <p>Create your Eteration account.</p>

        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>

            <input
              className={errors.firstName ? "input-error" : ""}
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);

                setErrors((prev) => ({
                  ...prev,
                  firstName: validateName(e.target.value),
                }));
              }}
              placeholder="Ali"
            />

            {errors.firstName && (
              <p className="field-error">{errors.firstName}</p>
            )}
          </div>

          <div className="form-group">
            <label>Last Name</label>

            <input
              className={errors.lastName ? "input-error" : ""}
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);

                setErrors((prev) => ({
                  ...prev,
                  lastName: validateName(e.target.value),
                }));
              }}
              placeholder="Yılmaz"
            />

            {errors.lastName && (
              <p className="field-error">{errors.lastName}</p>
            )}
          </div>
        </div>

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
            <p className="field-error">{errors.email}</p>
          )}
        </div>

        <div className="form-group">
          <label>Phone</label>

          <input
            className={errors.phone ? "input-error" : ""}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);

              setErrors((prev) => ({
                ...prev,
                phone: validatePhone(e.target.value),
              }));
            }}
            placeholder="+905551112233"
          />

          {errors.phone && (
            <p className="field-error">{errors.phone}</p>
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
            autoComplete="new-password"
          />

          {errors.password && (
            <p className="field-error">{errors.password}</p>
          )}
        </div>

        <button
          className="login-button"
          disabled={
            !firstName ||
            !lastName ||
            !email ||
            !phone ||
            !password
          }
          onClick={handleRegister}
        >
          Register
        </button>

        <p className="switch-auth">
          Already have an account?{" "}
          <span onClick={onOpenLogin}>Login</span>
        </p>
      </div>
    </div>
  );
}

export default RegisterModal;