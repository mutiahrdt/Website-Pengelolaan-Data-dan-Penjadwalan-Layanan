import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Form, Input, Select, Radio, message, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import FormUploadImage from "../../components/FormUploadImage";
import StatusTag from "../../components/StatusTag";
import TableActionButtons from "../../components/TableActionButtons";
import ModalWrapper from "../../components/ModalWrapper";
import dayjs from "dayjs";

const { Option } = Select;

// Fungsi untuk menghasilkan warna yang konsisten untuk Tag
const COLORS = ['geekblue', 'green', 'purple', 'magenta', 'cyan', 'gold', 'red', 'lime', 'blue'];
const generateConsistentColor = (str) => {
  if (!str) return 'default';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % COLORS.length);
  return COLORS[index];
};

export default function TerapisPage() {
  // State
  const [list, setList] = useState([]);
  const [cabangsAktif, setCabangsAktif] = useState([]); // Hanya menyimpan cabang aktif
  const [keahliansAktif, setKeahliansAktif] = useState([]); // Hanya menyimpan keahlian aktif
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  // Axios instance
  const axiosAuth = axios.create({
    baseURL: "/api",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // --- PERBAIKAN 1: Memanggil endpoint yang benar ---
  const loadData = async () => {
    setLoading(true);
    try {
      const [resTerapis, resCabangAktif, resKeahlianAktif] = await Promise.all([
        axiosAuth.get("/terapis"), // Mengambil SEMUA terapis untuk tabel
        axiosAuth.get("/cabang/aktif"), // Mengambil HANYA cabang AKTIF untuk form
        axiosAuth.get("/keahlian/aktif"), // Mengambil HANYA keahlian AKTIF untuk form
      ]);
      setList(resTerapis.data.data || []);
      setCabangsAktif(resCabangAktif.data.data || []);
      setKeahliansAktif(resKeahlianAktif.data.data || []);
    } catch (error) {
      message.error(error.response?.data?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- PERBAIKAN 2: Logika untuk menangani data nonaktif saat edit ---
  const openModal = (rec) => {
    form.resetFields();
    setEditing(rec || null);

    if (rec) {
      // Validasi Cabang
      const alokasiAktif = (rec.cabang || []).find(c => c.status_alokasi);
      let idCabangToShow = undefined;
      if (alokasiAktif && cabangsAktif.some(c => c.id_cabang === alokasiAktif.id_cabang)) {
        idCabangToShow = alokasiAktif.id_cabang;
      }

      // Validasi Keahlian
      const keahlianIdsToShow = (rec.keahlian_ids || []).filter(id => 
        keahliansAktif.some(k => k.id_keahlian === id)
      );

      form.setFieldsValue({
        nama_terapis: rec.nama_terapis,
        no_hp_terapis: rec.no_hp_terapis,
        gender_terapis: rec.gender_terapis,
        id_cabang: idCabangToShow, // Gunakan ID yang sudah divalidasi
        status_terapis: rec.status_terapis,
        keahlian_ids: keahlianIdsToShow, // Gunakan array ID yang sudah divalidasi
        foto_terapis: rec.foto_terapis
          ? [{
              uid: rec.id_terapis,
              name: rec.foto_terapis.split("/").pop(),
              status: "done",
              url: rec.foto_terapis.startsWith("http") ? rec.foto_terapis : `/assets/terapis/${rec.foto_terapis}`,
            }]
          : [],
      });
    } else {
      // Default untuk form tambah baru
      form.setFieldsValue({ status_terapis: true, keahlian_ids: [] });
    }
    setModalVisible(true);
  };

  const getDeviceDatetime = () => dayjs().format('YYYY-MM-DD HH:mm:ss');

  const handleOk = async () => {
    try {
      const vals = await form.validateFields();
      const formData = new FormData();

      Object.keys(vals).forEach(key => {
        if (key === 'foto_terapis') {
          if (vals.foto_terapis?.[0]?.originFileObj) {
            formData.append('foto_terapis', vals.foto_terapis[0].originFileObj);
          }
        } else if (key === 'keahlian_ids') {
          (vals.keahlian_ids || []).forEach(id => formData.append('keahlian_ids', id));
        } else if (vals[key] !== null && vals[key] !== undefined) {
          formData.append(key, vals[key]);
        }
      });
      formData.append("wkt_berlaku", getDeviceDatetime());

      if (editing) {
        await axiosAuth.put(`/terapis/${editing.id_terapis}`, formData);
        message.success("Terapis berhasil diperbarui");
      } else {
        await axiosAuth.post("/terapis", formData);
        message.success("Terapis berhasil ditambahkan");
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
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
      title: "Foto", dataIndex: "foto_terapis", width: 80,
      render: (foto) => foto ? (<img src={foto.startsWith("http") ? foto : `/assets/terapis/${foto}`} alt="foto" width="40" height="40" style={{ borderRadius: "50%", objectFit: "cover" }} onError={(e) => { e.target.onerror = null; e.target.src = "/default-avatar.jpg"; }}/>) : "N/A",
    },
    { title: "Nama Terapis", dataIndex: "nama_terapis", width: 150 },
    { title: "Inisial", dataIndex: "inisial_terapis", width: 80, align: 'center' },
    { title: "No HP", dataIndex: "no_hp_terapis", width: 150 },
    {
      title: "Keahlian", dataIndex: "keahlian_full", width: 220,
      render: (keahlian) => !keahlian || keahlian.length === 0 ? "-" : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {keahlian.map(k => (
            <Tag color={generateConsistentColor(k.nama_keahlian)} key={k.id_keahlian}>{k.nama_keahlian}</Tag>
          ))}
        </div>
      )
    },
    {
      title: "Cabang Aktif", width: 130,
      render: (row) => ([...(row.cabang || [])].sort((a, b) => new Date(b.waktu_berlaku) - new Date(a.waktu_berlaku))[0]?.nama_cabang || "-"),
    },
    { title: "Status Aktif", dataIndex: "status_terapis", render: (val) => <StatusTag value={val} />, width: 100 },
    { title: "Aksi", key: "action", render: (_, rec) => <TableActionButtons onEdit={() => openModal(rec)} />, width: 100 }
  ];

  function renderCabangList(rec) {
    if (!rec.cabang || rec.cabang.length === 0) return "Tidak ada riwayat penempatan cabang.";
    const sortedCabang = [...rec.cabang].sort((a, b) => new Date(b.waktu_berlaku) - new Date(a.waktu_berlaku));
    const latest = sortedCabang[0];
    return (
      <Table
        dataSource={sortedCabang}
        columns={[
          { title: "No.", render: (_, __, i) => i + 1, width: 50 },
          { title: "Cabang", dataIndex: "nama_cabang" },
          { title: "Waktu Berlaku", dataIndex: "waktu_berlaku", render: (val) => dayjs(val).format("DD MMMM YYYY HH:mm") },
          { title: "Status", render: (alokasi) => <StatusTag value={alokasi === latest && alokasi.status_alokasi} /> }
        ]}
        pagination={false} rowKey={c => c.id_cabang + c.waktu_berlaku} bordered size="small"
      />
    );
  }

  return (
    <div style={{ padding: 24, background: "#fff", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2>Pengelolaan Terapis</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Tambah</Button>
      </div>

      <Table
        columns={columns} dataSource={list} rowKey="id_terapis"
        loading={loading} bordered scroll={{ x: "max-content" }}
        expandable={{ expandedRowRender: renderCabangList }}
      />

      <ModalWrapper
        title={editing ? "Edit Terapis" : "Tambah Terapis"}
        open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleOk}
        width={500} destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Foto Terapis" name="foto_terapis" valuePropName="value" getValueFromEvent={e => (Array.isArray(e) ? e : e && e.fileList)} rules={[{ required: !editing, message: "Foto Terapis wajib diunggah" }]}>
            <FormUploadImage />
          </Form.Item>
          <Form.Item name="nama_terapis" label="Nama Terapis" rules={[{ required: true, message: "Nama Terapis wajib diisi" }, { min: 3, message: "Nama Terapis minimal harus 3 karakter" }]}>
            <Input placeholder="Masukkan nama lengkap terapis" />
          </Form.Item>
          <Form.Item name="no_hp_terapis" label="No. Handphone" rules={[{ required: true, message: "No. Handphone wajib diisi" }, { pattern: /^08\d{8,11}$/, message: "Format No. HP salah. Contoh benar: 081234567890 (10-13 digit)" }]}>
            <Input placeholder="Awali dengan 08, total 10-13 digit angka" />
          </Form.Item>
          <Form.Item name="gender_terapis" label="Jenis Kelamin" rules={[{ required: true, message: "Jenis Kelamin wajib dipilih" }]}>
            <Radio.Group><Radio value="P">Perempuan</Radio><Radio value="L">Laki-laki</Radio></Radio.Group>
          </Form.Item>
          
          {/* --- PERBAIKAN 3: Menggunakan state yang benar untuk dropdown --- */}
          <Form.Item name="id_cabang" label="Cabang Penempatan" rules={[{ required: true, message: "Cabang Penempatan wajib dipilih" }]}>
            <Select placeholder="Pilih cabang utama terapis">
              {cabangsAktif.map((c) => (<Option key={c.id_cabang} value={c.id_cabang}>{c.nama_cabang}</Option>))}
            </Select>
          </Form.Item>
          <Form.Item name="keahlian_ids" label="Keahlian">
            <Select mode="multiple" allowClear style={{ width: '100%' }} placeholder="Pilih satu atau lebih keahlian">
              {keahliansAktif.map((k) => (<Option key={k.id_keahlian} value={k.id_keahlian}>{k.nama_keahlian}</Option>))}
            </Select>
          </Form.Item>
          
          <Form.Item name="status_terapis" label="Status Terapis" rules={[{ required: true, message: "Status Terapis wajib dipilih" }]}>
            <Radio.Group><Radio value={true}>Aktif</Radio><Radio value={false}>Nonaktif</Radio></Radio.Group>
          </Form.Item>
        </Form>
      </ModalWrapper>
    </div>
  );
}