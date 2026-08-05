import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./PasswordInput.css";

function PasswordInput({
  value,
  onChange,
  error,
  placeholder,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div className="password-input">
        <input
          type={showPassword ? "text" : "password"}
          className={error ? "input-error" : ""}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          {...props}
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>

      {error && (
        <p className="field-error">
          {error}
        </p>
      )}
    </>
  );
}

export default PasswordInput;