import React from "react";
import { Modal } from "antd";
import { LogoutOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const { logout } = useAuth(); // ✅ Panggil hook hanya di sini
  const navigate = useNavigate();

  const handleLogout = () => {
    Modal.confirm({
      title: "Konfirmasi Logout",
      icon: <ExclamationCircleOutlined />,
      content: "Apakah Anda yakin ingin keluar dari akun?",
      okText: "Logout",
      cancelText: "Batal",
      centered: true,
      onOk() {
        logout();          // ✅ Jalankan fungsi logout dari context
        navigate("/home"); // ✅ Arahkan ke halaman home
      },
    });
  };

  return (
    <div style={{ padding: "16px", marginBottom: "20px" }}>
      <div
        onClick={handleLogout}
        style={{
          display: "flex",
          alignItems: "center",
          color: "#f5222d",
          cursor: "pointer",
          padding: "8px 16px",
        }}
      >
        <LogoutOutlined style={{ marginRight: 10 }} />
        <span>Logout</span>
      </div>
    </div>
  );
}
