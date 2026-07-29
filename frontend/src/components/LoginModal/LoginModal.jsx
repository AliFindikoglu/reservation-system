import { useState } from "react";
import "./LoginModal.css";
function LoginModal({isOpen, onLogin, onOpenRegister,}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    if (!isOpen) {
        return null;
    }
    return (
  <div className="modal-overlay">
    <div className="modal">
        <h2>Welcome</h2>
        <p>Please sign in to continue.</p>

        <div className="form-group">
          <label>Work Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            placeholder="name@eteration.com"
          />
        </div>

        <div className="form-group">
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />

          <button
  className="login-button"
  disabled={!email || !password}
  onClick={() =>
    onLogin({
      email,
      password,
    })
  }
>
  Login
</button>

<p className="switch-auth">
  Don't have an account?{" "}
  <span onClick={onOpenRegister}>Register</span>
</p>
        </div>
    </div>
    
  </div>
);
}
export default LoginModal;