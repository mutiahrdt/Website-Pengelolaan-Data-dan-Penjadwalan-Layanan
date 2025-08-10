// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);
  const [foto_admin, setFotoAdmin] = useState(null);
  const [inisial_admin, setInisialAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    const savedFoto = localStorage.getItem("foto_admin");
    const savedInisial = localStorage.getItem("inisial_admin");

    setRole(savedRole);
    setFotoAdmin(savedFoto);
    setInisialAdmin(savedInisial);
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.clear();
    setRole(null);
    setFotoAdmin(null);
    setInisialAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        foto_admin,
        setFotoAdmin,
        inisial_admin,
        setInisialAdmin,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
