import { createContext, useContext, useState, useEffect } from "react";
import {
  login as loginApi,
  register as registerApi,
  getMe,
} from "../api/authApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  async function login(credentials) {
    const data = await loginApi(credentials);

    localStorage.setItem("token", data.accessToken);
    setCurrentUser(data.user);

    return data;
  }

  async function register(user) {
    const data = await registerApi(user);

    localStorage.setItem("token", data.accessToken);
    setCurrentUser(data.user);

    return data;
  }

  function logout() {
    localStorage.removeItem("token");
    setCurrentUser(null);
  }

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const user = await getMe();

        setCurrentUser(user);
      } catch (error) {
        console.error(error);
        localStorage.removeItem("token");
      }
    }

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}