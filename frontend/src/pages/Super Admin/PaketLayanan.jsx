import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Table, Button, Form, Input, Radio, message, Row, Col,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import FormUploadImage from "../../components/FormUploadImage";
import StatusTag from "../../components/StatusTag";
import TableActionButtons from "../../components/TableActionButtons";
import ModalWrapper from "../../components/ModalWrapper";

export default function KeahlianPaketPage() {
  // State
  const [keahlians, setKeahlians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalKeahlian, setModalKeahlian] = useState(false);
  const [modalPaket, setModalPaket] = useState(false);
  const [editingKeahlian, setEditingKeahlian] = useState(null);
  const [editingPaket, setEditingPaket] = useState(null);
  const [selectedKeahlian, setSelectedKeahlian] = useState(null);
  const [searchText, setSearchText] = useState("");

  // Forms
  const [formKeahlian] = Form.useForm();
  const [formPaket] = Form.useForm();

  // Axios Instance
  const axiosAuth = axios.create({
    baseURL: "/api",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  // Data Loading
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axiosAuth.get("/keahlian-paket");
      setKeahlians(res.data.data || []);
    } catch (err) {
      message.error(err.response?.data?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Filter Logic
  const filteredData = useMemo(() => {
    if (!searchText) {
      return keahlians;
    }
    const lowercasedFilter = searchText.toLowerCase();
    return keahlians.filter(keahlian => {
      const isKeahlianMatch = keahlian.nama_keahlian.toLowerCase().includes(lowercasedFilter);
      if (isKeahlianMatch) return true;
      const isPaketMatch = (keahlian.paket || []).some(paket =>
        paket.nama_paket.toLowerCase().includes(lowercasedFilter)
      );
      return isPaketMatch;
    });
  }, [searchText, keahlians]);

  // Modal Handlers
  const openModalKeahlian = (rec = null) => {
    formKeahlian.resetFields();
    setEditingKeahlian(rec);
    if (rec) {
      formKeahlian.setFieldsValue({
        nama_keahlian: rec.nama_keahlian,
        status_keahlian: rec.status_keahlian,
      });
    } else {
      formKeahlian.setFieldsValue({ status_keahlian: true });
    }
    setModalKeahlian(true);
  };

  const openModalPaket = (keahlian, paket = null) => {
    if (!paket && !keahlian.status_keahlian) {
      message.warning("Tidak dapat menambah paket di bawah keahlian yang tidak aktif.");
      return;
    }
    formPaket.resetFields();
    setSelectedKeahlian(keahlian);
    setEditingPaket(paket);
    if (paket) {
      formPaket.setFieldsValue({
        nama_paket: paket.nama_paket,
        deskripsi_paket: paket.deskripsi_paket,
        kata_kunci: paket.kata_kunci,
        durasi_paket: paket.durasi_paket,
        status_paket: paket.status_paket,
        gambar_paket: paket.gambar_paket
          ? [{ uid: paket.id_paket, name: paket.gambar_paket, status: "done", url: `/assets/paket/${paket.gambar_paket}` }]
          : []
      });
    } else {
      formPaket.setFieldsValue({ status_paket: true });
    }
    setModalPaket(true);
  };

  // Submit Handlers
  const handleSubmitKeahlian = async () => {
    try {
      const vals = await formKeahlian.validateFields();
      if (editingKeahlian) {
        await axiosAuth.put(`/keahlian/${editingKeahlian.id_keahlian}`, vals);
        message.success("Keahlian berhasil diperbarui");
      } else {
        await axiosAuth.post("/keahlian", vals);
        message.success("Keahlian berhasil ditambahkan");
      }
      setModalKeahlian(false);
      loadData();
    } catch (e) {
      if (e.errorFields) message.error("Validasi gagal, silakan periksa isian Anda.");
      else message.error(e.response?.data?.message || "Gagal menyimpan data keahlian.");
    }
  };

  const handleSubmitPaket = async () => {
    try {
      const vals = await formPaket.validateFields();
      const fd = new FormData();
      fd.append("id_keahlian", selectedKeahlian.id_keahlian);
      for (const [k, v] of Object.entries(vals)) {
        if (k === "gambar_paket") {
          if (Array.isArray(v) && v.length > 0 && v[0].originFileObj) {
            fd.append("gambar_paket", v[0].originFileObj);
          }
        } else if (v !== undefined && v !== null) {
          fd.append(k, v);
        }
      }
      if (editingPaket) {
        await axiosAuth.put(`/paket/${editingPaket.id_paket}`, fd);
        message.success("Paket berhasil diperbarui");
      } else {
        await axiosAuth.post("/paket", fd);
        message.success("Paket berhasil ditambahkan");
      }
      setModalPaket(false);
      loadData();
    } catch (e) {
      if (e.errorFields) message.error("Validasi gagal, silakan periksa isian Anda.");
      else message.error(e.response?.data?.message || "Gagal menyimpan data paket.");
    }
  };

  // Table Columns
  const columns = [
    { title: "No.", render: (_, __, i) => i + 1, width: 60 },
    { title: "Nama Keahlian", dataIndex: "nama_keahlian", width: 300 },
    { title: "Status Aktif", dataIndex: "status_keahlian", render: st => <StatusTag value={st} />, width: 120 },
    {
      title: "Aksi", width: 200,
      render: (_, rec) => (<TableActionButtons onEdit={() => openModalKeahlian(rec)} onAdd={() => openModalPaket(rec)} addText="Paket" />),
    }
  ];

  const renderPaket = (keahlian) => (
    <Table
      dataSource={(keahlian.paket || []).map((p, i) => ({ ...p, no: i + 1 }))}
      rowKey="id_paket"
      pagination={false}
      columns={[
        { title: "No.", dataIndex: "no", width: 60 },
        { title: "Gambar", dataIndex: "gambar_paket", render: src => <img src={`/assets/paket/${src}`} alt="paket" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />, width: 100 },
        { title: "Nama Paket", dataIndex: "nama_paket", width: 180 },
        { title: "Durasi", dataIndex: "durasi_paket", render: d => `${d} Menit`, width: 100 },
        { title: "Keterangan", dataIndex: "deskripsi_paket", render: text => text || "-", width: 160 },
        { title: "Kata Kunci", dataIndex: "kata_kunci", render: text => text || "-", width: 160 },
        { title: "Status Aktif", render: (paketRecord) => (<StatusTag value={keahlian.status_keahlian && paketRecord.status_paket} />), width: 100 },
        { title: "Aksi", render: (_, paketRecord) => <Button icon={<EditOutlined />} onClick={() => openModalPaket(keahlian, paketRecord)} />, width: 100 }
      ]}
      bordered
      scroll={{ x: "max-content" }}
    />
  );

  return (
    <div style={{ padding: 24, background: "#fff", borderRadius: 12 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <h2>Pengelolaan Keahlian & Paket</h2>
        </Col>
        <Col>
          <Row gutter={16} align="middle">
            <Col>
              <Input.Search
                placeholder="Cari keahlian atau paket..."
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ width: 250 }}
              />
            </Col>
            <Col>
              <Button icon={<PlusOutlined />} type="primary" onClick={() => openModalKeahlian()}>
                Tambah Keahlian
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id_keahlian"
        expandable={{ expandedRowRender: renderPaket }}
        loading={loading}
        bordered
        scroll={{ x: "max-content" }}
      />
      
      {/* Modal Keahlian */}
      <ModalWrapper title={editingKeahlian ? "Edit Keahlian" : "Tambah Keahlian"} open={modalKeahlian} onCancel={() => setModalKeahlian(false)} onOk={handleSubmitKeahlian} destroyOnClose>
        <Form form={formKeahlian} layout="vertical">
          <Form.Item name="nama_keahlian" label="Nama Keahlian" rules={[{ required: true, message: "Nama Keahlian wajib diisi" }, { min: 3, message: "Nama Keahlian minimal harus 3 karakter" }]}>
            <Input placeholder="Contoh: Pijat Relaksasi" />
          </Form.Item>
          <Form.Item name="status_keahlian" label="Status" rules={[{ required: true, message: "Status Keahlian wajib dipilih" }]}>
            <Radio.Group><Radio value={true}>Aktif</Radio><Radio value={false}>Nonaktif</Radio></Radio.Group>
          </Form.Item>
        </Form>
      </ModalWrapper>
      
      {/* Modal Paket */}
      <ModalWrapper title={editingPaket ? "Edit Paket" : "Tambah Paket"} open={modalPaket} onCancel={() => setModalPaket(false)} onOk={handleSubmitPaket} width={600} destroyOnClose>
        <Form form={formPaket} layout="vertical">
          <Form.Item label="Gambar Paket" name="gambar_paket" valuePropName="value" getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList} rules={[{ required: !editingPaket, message: "Gambar Paket wajib diunggah" }]}>
            <FormUploadImage />
          </Form.Item>
          <Form.Item name="nama_paket" label="Nama Paket" rules={[{ required: true, message: "Nama Paket wajib diisi" }, { min: 5, message: "Nama Paket minimal harus 5 karakter" }]}>
            <Input placeholder="Contoh: Paket Pijat Full Body" />
          </Form.Item>
          <Form.Item name="durasi_paket" label="Durasi (dalam Menit)" rules={[{ required: true, message: "Durasi wajib diisi" }, { pattern: /^[1-9][0-9]*$/, message: "Durasi hanya boleh berisi angka positif" }]}>
            <Input placeholder="Masukkan durasi dalam angka, contoh: 90" />
          </Form.Item>
          <Form.Item name="deskripsi_paket" label="Deskripsi Paket (Opsional)">
            <Input.TextArea rows={3} placeholder="Jelaskan secara singkat mengenai paket ini" />
          </Form.Item>
          <Form.Item name="kata_kunci" label="Kata Kunci (Opsional)">
            <Input.TextArea rows={2} placeholder="Pisahkan dengan koma, contoh: cedera, relaksasi" />
          </Form.Item>
          <Form.Item name="status_paket" label="Status Paket" rules={[{ required: true, message: "Status Paket wajib dipilih" }]}>
            <Radio.Group><Radio value={true}>Aktif</Radio><Radio value={false}>Nonaktif</Radio></Radio.Group>
          </Form.Item>
        </Form>
      </ModalWrapper>
    </div>
  );
}