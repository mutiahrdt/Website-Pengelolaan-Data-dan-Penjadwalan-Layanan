import React, { useState } from "react";
import { Row, Col, Input, Button, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import signInImage from "../assets/massage-sign-in.jpg";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { setRole, setFotoAdmin, setInisialAdmin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("superadmin");
  const [password, setPassword] = useState("superadmin123");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
  if (!username || !password) {
    return message.warning("Username dan password harus diisi");
  }
  setLoading(true);
  try {
    const res = await axios.post("/api/signin", { username, password });
    if (res.data.success) {
      const { token, user } = res.data.data;
      const userRole = user.role;

      // Pastikan path foto_admin
      let fotoAdminFinal = user.foto_admin || "";
      if (fotoAdminFinal && !fotoAdminFinal.startsWith("/assets/")) {
        fotoAdminFinal = `/assets/administratif/${fotoAdminFinal}`;
      }

      // === INI TAMBAHAN PENTING ===
      // Simpan id_cabang (hanya untuk admin)
      if (user.id_cabang) {
        localStorage.setItem("id_cabang", user.id_cabang);
      } else {
        localStorage.removeItem("id_cabang"); // jaga-jaga kalau superadmin
      }
      // ===========================

      // Simpan ke localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);
      localStorage.setItem("foto_admin", fotoAdminFinal);
      localStorage.setItem("inisial_admin", user.inisial_admin || "");

      // Simpan ke context
      setRole(userRole);
      setFotoAdmin(fotoAdminFinal);
      setInisialAdmin(user.inisial_admin || "");

      message.success("Login berhasil");

      // Arahkan ke dashboard sesuai role
      if (userRole === "Superadmin") navigate("/cabang-ruangan");
      else if (userRole === "Admin") navigate("/harga-paket");
      else message.error(`Role tidak dikenal: ${userRole}`);
    } else {
      message.error(res.data.message || "Login gagal");
    }
  } catch (err) {
    message.error(
      err.response?.data?.message
        ? `Login gagal: ${err.response.data.message}`
        : "Error saat login: " + err.message
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden" }}>
      <Row gutter={0} style={{ height: "100%" }}>
        <Col
          xs={0}
          md={12}
          style={{
            backgroundImage: `url(${signInImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <Col xs={24} md={12} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 380, padding: "24px" }}>
            <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 600, marginBottom: 28 }}>Sign In</h2>
            <Input
              size="large"
              placeholder="Username"
              prefix={<UserOutlined />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ marginBottom: 16, borderRadius: 30, height: 44 }}
            />
            <Input.Password
              size="large"
              placeholder="Password"
              prefix={<LockOutlined />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: 16, borderRadius: 30, height: 44 }}
            />
            <div
              onClick={() => message.info("Fitur lupa password belum tersedia")}
              style={{ fontSize: 13, textAlign: "right", color: "#888", marginBottom: 20, cursor: "pointer" }}
            >
              Forgot Password?
            </div>
            <Button
              type="primary"
              block
              loading={loading}
              onClick={handleSubmit}
              size="large"
              style={{ borderRadius: 30, height: 44 }}
            >
              Sign In
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Login;