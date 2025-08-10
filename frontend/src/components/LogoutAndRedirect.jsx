import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LogoutAndRedirect() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();              // hapus session dari context dan localStorage
    navigate("/", { replace: true }); // arahkan ke halaman utama
  }, [logout, navigate]);

  return null;
}
