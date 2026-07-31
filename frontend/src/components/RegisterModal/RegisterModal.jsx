import { useState } from "react";
import toast from "react-hot-toast";
import "./RegisterModal.css";
function RegisterModal({
  isOpen,
  onRegister,
  onClose,
  onOpenLogin,
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  function validateName(value) {
    if (!value.trim()) return "Full name is required.";
    if (value.trim().length < 3)
      return "Full name must be at least 3 characters.";
    return "";
  }

  function validateEmail(value) {
    if (!value) return "Email is required.";
    if (!value.endsWith("@eteration.com"))
      return "Please use your work email.";
    return "";
  }

  function validatePhone(value) {
    const phoneRegex = /^(\+90|0)?5\d{9}$/;

    if (!value) return "Phone number is required.";

    if (!phoneRegex.test(value.replace(/\s/g, "")))
      return "Please enter a valid Turkish phone number.";

    return "";
  }

  function validatePassword(value) {
    if (!value) return "Password is required.";

    if (value.length < 8)
      return "Password must be at least 8 characters.";

    return "";
  }

  if (!isOpen) return null;

  async function handleRegister() {
    const validationErrors = {
      fullName: validateName(fullName),
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
        fullName,
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

        <div className="form-group">
          <label>Full Name</label>
          <input
            className={errors.fullName ? "input-error" : ""}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);

              setErrors((prev) => ({
                ...prev,
                fullName: validateName(e.target.value),
              }));
            }}
            placeholder="Damla Nur Sert"
          />
          {errors.fullName && (
<p className="field-error">
  {errors.fullName || "\u00A0"}
</p>          )}
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
<p className="field-error">
  {errors.email || "\u00A0"}
</p>          )}
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
<p className="field-error">
  {errors.phone || "\u00A0"}
</p>          )}
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            className={errors.password ? "input-error" : ""}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);

              setErrors((prev) => ({
                ...prev,
                password: validatePassword(e.target.value),
              }));
            }}
            placeholder="Enter your password"
          />
          {errors.password && (
<p className="field-error">
  {errors.password || "\u00A0"}
</p>          )}
        </div>

        <button
          className="login-button"
          disabled={!fullName || !email || !phone || !password}
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