import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  Radio,
  message,
} from "antd";
import {
  PlusOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import FormUploadImage from "../../components/FormUploadImage";
import StatusTag from "../../components/StatusTag";
import TableActionButtons from "../../components/TableActionButtons";
import ModalWrapper from "../../components/ModalWrapper";
import dayjs from "dayjs";

const { Option } = Select;

export default function AkunAdminPage() {
  const [list, setList] = useState([]);
  const [cabangs, setCabangs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const token = localStorage.getItem("token");
  const axiosAuth = axios.create({
    baseURL: "/api",
    headers: { Authorization: `Bearer ${token}` }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [resAdmin, resCabang] = await Promise.all([
        axiosAuth.get("/admin"),
        axiosAuth.get("/cabang/aktif"),
      ]);
      setList(resAdmin.data.data || []);
      setCabangs(resCabang.data.data || []);
    } catch (err) {
      message.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (rec) => {
    form.resetFields();
    setEditing(rec || null);

    if (rec) {
      // --- LOGIKA BARU YANG SUDAH DIPERBAIKI ---
      // 1. Cari alokasi cabang yang aktif untuk admin ini dari data 'rec'.
      const alokasiAktif = (rec.cabang || []).find(c => c.status_alokasi);
      
      let idCabangToShow = undefined; // Defaultnya kosong (undefined)

      // 2. Jika ada alokasi aktif, cek apakah ID cabang tersebut masih ada 
      //    di dalam daftar 'cabangs' kita (yang hanya berisi cabang aktif dari API).
      if (alokasiAktif) {
        // 'cabangs' adalah state yang berisi daftar cabang dari GET /api/cabang/aktif
        const isCabangStillActive = cabangs.some(c => c.id_cabang === alokasiAktif.id_cabang);
        
        if (isCabangStillActive) {
          idCabangToShow = alokasiAktif.id_cabang; // Jika masih aktif, kita set sebagai nilai default
        }
        // Jika cabang dari alokasiAktif sudah tidak ada di daftar `cabangs` (artinya sudah dinonaktifkan),
        // maka `idCabangToShow` akan tetap `undefined`. 
        // Ini akan memaksa pengguna untuk memilih cabang baru yang valid.
      }
      form.setFieldsValue({
        nama_admin: rec.nama_admin,
        username: (rec.username || "").trim(),
        password: "", // Selalu kosongkan password saat membuka modal edit
        id_cabang: idCabangToShow, // Gunakan variabel yang sudah divalidasi
        status_admin: rec.status_admin ? "Aktif" : "Nonaktif",
        foto_admin: rec.foto_admin
          ? [{
              uid: rec.id_administratif,
              name: rec.foto_admin.split("/").pop(),
              status: "done",
              // Pastikan URL selalu diawali slash untuk path absolut
              url: rec.foto_admin.startsWith("/") ? rec.foto_admin : `/assets/administratif/${rec.foto_admin}`,
            }]
          : [],
      });
    } else {
      // Untuk admin baru, set default value
      form.setFieldsValue({ status_admin: "Aktif" });
    }
    setModalVisible(true);
  };

  function getDeviceDatetime() {
    return dayjs().format('YYYY-MM-DD HH:mm:ss');
  }

  // PERBAIKAN: Validasi manual di sini dihapus, diserahkan sepenuhnya ke Form.Item
  const handleOk = async () => {
    try {
      const vals = await form.validateFields();
      
      const formData = new FormData();
      formData.append("nama_admin", vals.nama_admin);
      formData.append("username", (vals.username || "").trim());
      formData.append("id_cabang", vals.id_cabang);
      formData.append("status_admin", vals.status_admin === "Aktif");
      formData.append("nama_role", "Admin");
      formData.append("wkt_berlaku", getDeviceDatetime());

      if (vals.password) {
        formData.append("password", vals.password);
      }
      if (vals.foto_admin?.[0]?.originFileObj) {
        formData.append("foto_admin", vals.foto_admin[0].originFileObj);
      }

      if (editing) {
        await axiosAuth.put(`/admin/${editing.id_administratif}`, formData);
        message.success("Admin berhasil diperbarui");
      } else {
        await axiosAuth.post("/admin", formData);
        message.success("Admin berhasil ditambahkan");
      }

      setModalVisible(false);
      loadData();
    } catch (err) {
      // Ant Design akan otomatis scroll ke field yang error,
      // jadi kita hanya perlu menampilkan pesan umum.
      if (err.errorFields) {
        message.error("Validasi gagal, silakan periksa kembali isian Anda.");
      } else {
        message.error(err?.response?.data?.message || "Terjadi kesalahan saat menyimpan data.");
      }
    }
  };

  const columns = [
    { title: "No.", render: (_, __, i) => i + 1, width: 60 },
    {
      title: "Foto",
      dataIndex: "foto_admin",
      render: (foto) =>
        foto ? (
          <img
            src={foto.startsWith("/") ? foto : `/assets/administratif/${foto}`}
            alt="foto" width="40" height="40"
            style={{ borderRadius: "50%", objectFit: "cover" }}
            onError={(e) => { e.target.onerror = null; e.target.src = "/default-avatar.jpg"; }}
          />
        ) : "Tidak ada"
    },
    { title: "Nama", dataIndex: "nama_admin" },
    { title: "Inisial", dataIndex: "inisial_admin" },
    { title: "Username", dataIndex: "username" },
    { title: "Password", render: () => "********" },
    {
      title: "Cabang Aktif",
      render: (row) => {
        const sorted = [...(row.cabang || [])].sort((a, b) => new Date(b.waktu_berlaku) - new Date(a.waktu_berlaku));
        return sorted[0]?.nama_cabang || "-";
      }
    },
    {
      title: "Status Aktif",
      dataIndex: "status_admin",
      render: (val) => <StatusTag value={val} />
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, rec) => <TableActionButtons onEdit={() => openModal(rec)} />
    }
  ];

  function renderCabangList(rec) {
    const sorted = [...(rec.cabang || [])].sort((a, b) => new Date(b.waktu_berlaku) - new Date(a.waktu_berlaku));
    return (
      <Table
        dataSource={sorted}
        columns={[
          { title: "No.", render: (_, __, i) => i + 1 },
          { title: "Cabang", dataIndex: "nama_cabang" },
          { title: "Waktu Berlaku", dataIndex: "waktu_berlaku", render: (val) => dayjs(val).format("DD MMM YYYY HH:mm") },
          { title: "Status", render: (alokasi) => (alokasi === sorted[0] && alokasi.status_alokasi) ? "Aktif" : "Tidak Aktif" }
        ]}
        pagination={false}
        rowKey={(_, i) => i}
        bordered
      />
    );
  }

  return (
    <div style={{ padding: 24, background: "#fff", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2>Pengelolaan Akun Admin</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          Tambah
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={list}
        rowKey="id_administratif"
        loading={loading}
        bordered
        scroll={{ x: "max-content" }}
        expandable={{ expandedRowRender: renderCabangList }}
      />

      <ModalWrapper
        title={editing ? "Edit Admin" : "Tambah Admin"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleOk}
        width={500}
        destroyOnClose // Gunakan destroyOnClose agar form di-reset saat modal ditutup
      >
        <Form form={form} layout="vertical">
          {/* --- PERBAIKAN VALIDASI DIMULAI DARI SINI --- */}
          <Form.Item
            label="Unggah Foto"
            name="foto_admin"
            valuePropName="value"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList} // Disesuaikan dengan FormUploadImage
            // Hanya wajib saat menambah admin baru
            rules={[{ required: !editing, message: "Foto Admin wajib diunggah" }]}
          >
            <FormUploadImage />
          </Form.Item>
          <Form.Item
            name="nama_admin"
            label="Nama Admin"
            rules={[{ required: true, message: "Nama Admin wajib diisi" }]}
          >
            <Input placeholder="Masukkan nama lengkap admin" />
          </Form.Item>
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: "Username wajib diisi" },
              {
                pattern: /^[a-zA-Z0-9_.-]+$/,
                message: "Username hanya boleh berisi huruf, angka, dan karakter _ . - (tanpa spasi)",
              },
              { max: 15, message: "Username tidak boleh lebih dari 15 karakter" },
              { min: 4, message: "Username minimal harus 4 karakter"},
              {
                validator: (_, value) => {
                  if (value && value.trim() !== value) {
                    return Promise.reject(new Error("Username tidak boleh diawali atau diakhiri dengan spasi"));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input placeholder="Masukkan username unik" />
          </Form.Item>
          <Form.Item
            name="password"
            label={editing ? "Password Baru (Opsional)" : "Password"}
            rules={[
              // Hanya wajib saat menambah admin baru
              { required: !editing, message: "Password wajib diisi saat membuat akun baru" },
              { min: 6, message: "Password minimal harus 6 karakter" }
            ]}
          >
            <Input.Password
              placeholder={editing ? "Isi untuk mengganti password" : "Masukkan minimal 6 karakter"}
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>
          <Form.Item
            name="id_cabang"
            label="Cabang"
            rules={[{ required: true, message: "Cabang wajib dipilih" }]}
          >
            <Select placeholder="Pilih cabang penempatan">
              {cabangs.map((c) => (
                <Option key={c.id_cabang} value={c.id_cabang}>
                  {c.nama_cabang}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status_admin"
            label="Status Akun"
            rules={[{ required: true, message: "Status akun wajib dipilih" }]}
          >
            <Radio.Group>
              <Radio value="Aktif">Aktif</Radio>
              <Radio value="Nonaktif">Nonaktif</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </ModalWrapper>
    </div>
  );
}