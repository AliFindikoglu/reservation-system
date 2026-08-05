import "./ProfileSettings.css";
import { useState, useEffect } from "react";
import { updateProfile, changePassword } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import PasswordInput from "../../components/PasswordInput/PasswordInput";

import {
    validateName,
    validatePhone,
    formatName,
    validatePassword,
    validateConfirmPassword,
    validateCurrentPassword
} from "../../utils/validation";

function ProfileSettings({ user, setUser }) {

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [errors, setErrors] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const { setCurrentUser } = useAuth();

    useEffect(() => {
        if (!user) return;

        const parts = user.fullName.trim().split(" ");

        const last = parts.pop() || "";
        const first = parts.join(" ");

        setFirstName(first);
        setLastName(last);

        const formattedPhone = user.phone?.startsWith("+90")
            ? "0" + user.phone.slice(3)
            : user.phone;

        setPhone(formattedPhone || "");

    }, [user]);

    const hasChanges =
        `${firstName.trim()} ${lastName.trim()}` !== (user?.fullName ?? "") ||
        phone.trim() !== (user?.phone ?? "");

    const handleSaveChanges = async () => {

        const validationErrors = {
            firstName: validateName(firstName),
            lastName: validateName(lastName),
            phone: validatePhone(phone)
        };

        setErrors(prev => ({
            ...prev,
            ...validationErrors
        }));

        if (Object.values(validationErrors).some(Boolean)) {
            return;
        }

        try {

            const formattedFullName =
                `${formatName(firstName)} ${formatName(lastName)}`;

            const formattedPhone = phone.trim();

            const nameChanged =
                formattedFullName !== user.fullName;

            const phoneChanged =
                formattedPhone !== user.phone;

            const updatedUser = await updateProfile({
                fullName: formattedFullName,
                phone: formattedPhone,
            });

            setCurrentUser(updatedUser);
            setUser(updatedUser);

            if (nameChanged && phoneChanged) {
                toast.success("Profile information updated successfully.");
            } else if (nameChanged) {
                toast.success("Your name has been updated.");
            } else if (phoneChanged) {
                toast.success("Your phone number has been updated.");
            }

        } catch (error) {
            toast.error(error.message);
        }
    };


    const hasPasswordChanges =
        currentPassword.trim() &&
        newPassword.trim() &&
        confirmPassword.trim();


    const handlePasswordUpdate = async () => {

        const validationErrors = {
            currentPassword: validateCurrentPassword(currentPassword),
            newPassword: validatePassword(newPassword),
            confirmPassword: validateConfirmPassword(
                newPassword,
                confirmPassword
            )
        };

        setErrors(prev => ({
            ...prev,
            ...validationErrors
        }));

        if (Object.values(validationErrors).some(Boolean)) {
            return;
        }

        try {

            await changePassword({
                currentPassword,
                newPassword
            });

            toast.success("Password updated successfully.");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

        } catch (error) {
            setErrors((prev) => ({
                ...prev,
                currentPassword: error.message,
            }));
        }
    };

    return (
        <div className="profile-settings">

            <h1>Account Settings</h1>

            <section className="profile-summary">

                <div className="profile-avatar">
                    {user?.fullName?.slice(0, 1)?.toUpperCase() ?? "U"}
                </div>

                <div className="profile-info">
                    <h2>{user?.fullName}</h2>
                    <p>{user?.email}</p>

                    <span>
                        {user?.role === "ADMIN"
                            ? "Administrator"
                            : "User"}
                    </span>
                </div>

            </section>


            <section className="settings-card">

                <h3>Personal Information</h3>

                <div className="divider"></div>

                <div className="form-grid">

                    <div className="field">
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
                        />

                        {errors.firstName && (
                            <p className="field-error">
                                {errors.firstName}
                            </p>
                        )}
                    </div>


                    <div className="field">
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
                        />

                        {errors.lastName && (
                            <p className="field-error">
                                {errors.lastName}
                            </p>
                        )}
                    </div>


                    <div className="field">
                        <label>Email</label>

                        <input
                            value={user?.email ?? ""}
                            readOnly
                        />
                    </div>


                    <div className="field">
                        <label>Phone Number</label>

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
                        />

                        {errors.phone && (
                            <p className="field-error">
                                {errors.phone}
                            </p>
                        )}
                    </div>
                </div>


                <button
                    className="profile-save-btn"
                    onClick={handleSaveChanges}
                    disabled={!hasChanges}
                >
                    Save Changes
                </button>

            </section>


            <section className="settings-card">

                <h3>Security</h3>

                <div className="divider"></div>


                <div className="security-form">

                    <div className="field">
                        <label>Current Password</label>

                        <PasswordInput
                            value={currentPassword}
                            onChange={(e) => {
                                setCurrentPassword(e.target.value);

                                setErrors((prev) => ({
                                    ...prev,
                                    currentPassword: validateCurrentPassword(e.target.value),
                                }));
                            }}
                            error={errors.currentPassword}
                            placeholder="Enter current password"
                            autoComplete="current-password"
                        />
                    </div>


                    <div className="field">
                        <label>New Password</label>

                        <PasswordInput
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);

                                setErrors((prev) => ({
                                    ...prev,
                                    newPassword: validatePassword(e.target.value),
                                    confirmPassword: validateConfirmPassword(
                                        e.target.value,
                                        confirmPassword
                                    ),
                                }));
                            }}
                            error={errors.newPassword}
                            placeholder="Enter new password"
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="field">
                        <label>Confirm Password</label>

                        <PasswordInput
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);

                                setErrors((prev) => ({
                                    ...prev,
                                    confirmPassword: validateConfirmPassword(
                                        newPassword,
                                        e.target.value
                                    ),
                                }));
                            }}
                            error={errors.confirmPassword}
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                        />
                    </div>

                </div>


                <button
                    className="password-btn"
                    onClick={handlePasswordUpdate}
                    disabled={!hasPasswordChanges}
                >
                    Update Password
                </button>

            </section>

        </div>
    );
}

export default ProfileSettings;