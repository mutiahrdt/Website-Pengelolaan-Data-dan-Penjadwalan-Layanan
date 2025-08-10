import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Form, Input, TimePicker, Radio, message, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import ModalWrapper from "../../components/ModalWrapper";
import TableActionButtons from "../../components/TableActionButtons";
import StatusTag from "../../components/StatusTag";

const SifSesiPage = () => {
  const [sifList, setSifList] = useState([]);
  const [sesiList, setSesiList] = useState([]);
  const [cabangList, setCabangList] = useState([]);
  const [modalSifVisible, setModalSifVisible] = useState(false);
  const [modalSesiVisible, setModalSesiVisible] = useState(false);
  const [editingSif, setEditingSif] = useState(null);
  const [editingSesi, setEditingSesi] = useState(null);
  const [formSif] = Form.useForm();
  const [formSesi] = Form.useForm();

  const token = localStorage.getItem("token");
  const axiosAuth = axios.create({
    baseURL: "/api",
    headers: { Authorization: `Bearer ${token}` }
  });

  const loadData = async () => {
    try {
      const [sifRes, sesiRes, cabangRes] = await Promise.all([
        axiosAuth.get("/sif"),
        axiosAuth.get("/sesi"),
        axiosAuth.get("/cabang"),
      ]);
      setSifList(sifRes.data.data);
      setSesiList(sesiRes.data.data);
      setCabangList(cabangRes.data.data);
    } catch (err) {
      message.error("Gagal memuat data Sif, Sesi, atau Cabang");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openSifModal = (record = null) => {
    formSif.resetFields();
    setEditingSif(record);
    if (record) {
      formSif.setFieldsValue({
        nama_sif: record.nama_sif,
        jam_mulai: dayjs(record.jam_mulai, "HH:mm:ss"),
        jam_selesai: dayjs(record.jam_selesai, "HH:mm:ss"),
        status_sif: record.status_sif, // Langsung gunakan boolean
      });
    } else {
      formSif.setFieldsValue({ status_sif: true });
    }
    setModalSifVisible(true);
  };

  const openSesiModal = (record = null) => {
    formSesi.resetFields();
    setEditingSesi(record);
    if (record) {
      formSesi.setFieldsValue({
        id_cabang: record.id_cabang,
        nama_sesi: record.nama_sesi,
        jam_mulai: dayjs(record.jam_mulai, "HH:mm:ss"),
        jam_selesai: dayjs(record.jam_selesai, "HH:mm:ss"),
        status_sesi: record.status_sesi, // Langsung gunakan boolean
      });
    } else {
      formSesi.setFieldsValue({ status_sesi: true });
    }
    setModalSesiVisible(true);
  };

  const handleSifSubmit = async () => {
    try {
      const values = await formSif.validateFields();
      const payload = {
        ...values,
        jam_mulai: values.jam_mulai.format("HH:mm:ss"),
        jam_selesai: values.jam_selesai.format("HH:mm:ss"),
      };
      const url = editingSif ? `/sif/${editingSif.id_sif}` : "/sif";
      const method = editingSif ? "put" : "post";
      await axiosAuth[method](url, payload);
      message.success(editingSif ? "Sif berhasil diperbarui" : "Sif berhasil ditambahkan");
      setModalSifVisible(false);
      loadData();
    } catch (e) {
      if (e.errorFields) message.error("Validasi gagal, silakan periksa isian Anda.");
      else message.error(e.response?.data?.message || "Gagal menyimpan Sif");
    }
  };

  const handleSesiSubmit = async () => {
    try {
      const values = await formSesi.validateFields();
      const payload = {
        ...values,
        jam_mulai: values.jam_mulai.format("HH:mm:ss"),
        jam_selesai: values.jam_selesai.format("HH:mm:ss"),
      };
      const url = editingSesi ? `/sesi/${editingSesi.id_sesi}` : "/sesi";
      const method = editingSesi ? "put" : "post";
      await axiosAuth[method](url, payload);
      message.success(editingSesi ? "Sesi berhasil diperbarui" : "Sesi berhasil ditambahkan");
      setModalSesiVisible(false);
      loadData();
    } catch (e) {
      if (e.errorFields) message.error("Validasi gagal, silakan periksa isian Anda.");
      else message.error(e.response?.data?.message || "Gagal menyimpan Sesi");
    }
  };

  const timeCol = (mulai, selesai) => {
    if (!mulai || !selesai) return '-';
    return `${dayjs(mulai, "HH:mm:ss").format("HH:mm")} - ${dayjs(selesai, "HH:mm:ss").format("HH:mm")}`;
  };

  return (
    <div style={{ padding: 24, background: "#fff", borderRadius: 12 }}>
      {/* Tabel Sesi */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2>Pengelolaan Sesi</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openSesiModal()}>Tambah Sesi</Button>
      </div>
      <Table
        dataSource={sesiList.map((v, i) => ({ ...v, key: v.id_sesi, no: i + 1 }))}
        pagination={false}
        columns={[
          { title: "No.", dataIndex: "no", width: 60 },
          { title: "Nama Sesi", dataIndex: "nama_sesi" },
          { title: "Jam Sesi", render: (_, r) => timeCol(r.jam_mulai, r.jam_selesai) },
          { title: "Cabang", dataIndex: "id_cabang", render: v => { const c = cabangList.find(c => c.id_cabang === v); return c ? c.nama_cabang : v; } },
          { title: "Status Aktif", dataIndex: "status_sesi", render: val => <StatusTag value={val} /> },
          { title: "Aksi", render: (_, r) => <TableActionButtons onEdit={() => openSesiModal(r)} /> }
        ]}
        bordered
        scroll={{ x: 'max-content' }}
      />

      {/* Tabel Sif */}
      <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2>Pengelolaan Sif</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openSifModal()}>Tambah Sif</Button>
      </div>
      <Table
        dataSource={sifList.map((v, i) => ({ ...v, key: v.id_sif, no: i + 1 }))}
        pagination={false}
        columns={[
          { title: "No.", dataIndex: "no", width: 60 },
          { title: "Nama Sif", dataIndex: "nama_sif" },
          { title: "Jam Kerja", render: (_, r) => timeCol(r.jam_mulai, r.jam_selesai) },
          { title: "Status Aktif", dataIndex: "status_sif", render: val => <StatusTag value={val} /> },
          { title: "Aksi", render: (_, r) => <TableActionButtons onEdit={() => openSifModal(r)} /> }
        ]}
        bordered
        scroll={{ x: 'max-content' }}
      />

      {/* --- MODAL SESI DENGAN VALIDASI --- */}
      <ModalWrapper title={editingSesi ? "Edit Sesi" : "Tambah Sesi"} open={modalSesiVisible} onCancel={() => setModalSesiVisible(false)} onOk={handleSesiSubmit} destroyOnClose>
        <Form form={formSesi} layout="vertical">
          <Form.Item name="nama_sesi" label="Nama Sesi" rules={[{ required: true, message: "Nama Sesi wajib diisi" }, { min: 3, message: "Nama Sesi minimal 3 karakter" }]}>
            <Input placeholder="Contoh: Sesi 1" />
          </Form.Item>
          <Form.Item name="jam_mulai" label="Jam Mulai" rules={[{ required: true, message: "Jam Mulai wajib dipilih" }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Pilih jam mulai sesi" />
          </Form.Item>
          <Form.Item
            name="jam_selesai"
            label="Jam Selesai"
            dependencies={['jam_mulai']} // Bergantung pada field jam_mulai
            rules={[
              { required: true, message: "Jam Selesai wajib dipilih" },
              // Validasi kustom untuk membandingkan jam
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const jamMulai = getFieldValue('jam_mulai');
                  if (!value || !jamMulai) {
                    return Promise.resolve(); // Jangan validasi jika salah satu kosong
                  }
                  if (value.isBefore(jamMulai) || value.isSame(jamMulai)) {
                    return Promise.reject(new Error('Jam Selesai harus setelah Jam Mulai'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Pilih jam selesai sesi" />
          </Form.Item>
          <Form.Item name="id_cabang" label="Cabang" rules={[{ required: true, message: "Cabang wajib dipilih" }]}>
            <Select placeholder="Pilih cabang untuk sesi ini" options={cabangList.map(c => ({ value: c.id_cabang, label: c.nama_cabang }))} />
          </Form.Item>
          <Form.Item name="status_sesi" label="Status Sesi" rules={[{ required: true, message: "Status Sesi wajib dipilih" }]}>
            <Radio.Group><Radio value={true}>Aktif</Radio><Radio value={false}>Nonaktif</Radio></Radio.Group>
          </Form.Item>
        </Form>
      </ModalWrapper>

      {/* --- MODAL SIF DENGAN VALIDASI --- */}
      <ModalWrapper title={editingSif ? "Edit Sif" : "Tambah Sif"} open={modalSifVisible} onCancel={() => setModalSifVisible(false)} onOk={handleSifSubmit} destroyOnClose>
        <Form form={formSif} layout="vertical">
          <Form.Item name="nama_sif" label="Nama Sif" rules={[{ required: true, message: "Nama Sif wajib diisi" }, { min: 3, message: "Nama Sif minimal 3 karakter" }]}>
            <Input placeholder="Contoh: Sif Pagi" />
          </Form.Item>
          <Form.Item name="jam_mulai" label="Jam Mulai" rules={[{ required: true, message: "Jam Mulai wajib dipilih" }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Pilih jam mulai sif" />
          </Form.Item>
          <Form.Item
            name="jam_selesai"
            label="Jam Selesai"
            dependencies={['jam_mulai']}
            rules={[
              { required: true, message: "Jam Selesai wajib dipilih" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const jamMulai = getFieldValue('jam_mulai');
                  if (!value || !jamMulai) {
                    return Promise.resolve();
                  }
                  if (value.isBefore(jamMulai) || value.isSame(jamMulai)) {
                    return Promise.reject(new Error('Jam Selesai harus setelah Jam Mulai'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Pilih jam selesai sif" />
          </Form.Item>
          <Form.Item name="status_sif" label="Status Sif" rules={[{ required: true, message: "Status Sif wajib dipilih" }]}>
            <Radio.Group><Radio value={true}>Aktif</Radio><Radio value={false}>Nonaktif</Radio></Radio.Group>
          </Form.Item>
        </Form>
      </ModalWrapper>
    </div>
  );
};

export default SifSesiPage;