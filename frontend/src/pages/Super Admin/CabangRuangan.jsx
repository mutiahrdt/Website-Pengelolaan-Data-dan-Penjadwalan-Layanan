import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Form,
  Input,
  Radio,
  message,
  Spin,
} from "antd";
import {
  EditOutlined,
  PlusOutlined
} from "@ant-design/icons";
import FormUploadImage from "../../components/FormUploadImage";
import StatusTag from "../../components/StatusTag";
import TableActionButtons from "../../components/TableActionButtons";
import ExpandedRowTable from "../../components/ExpandedRowTable";
import ModalWrapper from "../../components/ModalWrapper";

const CabangRuanganPage = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalRuanganVisible, setModalRuanganVisible] = useState(false);
  const [editingCabang, setEditingCabang] = useState(null);
  const [editingRuangan, setEditingRuangan] = useState(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [ruanganMap, setRuanganMap] = useState({});
  const [loadingRuangan, setLoadingRuangan] = useState({});
  const [form] = Form.useForm();
  const [formRuangan] = Form.useForm();

  const token = localStorage.getItem("token");
  const axiosAuth = axios.create({
    baseURL: "/api",
    headers: { Authorization: `Bearer ${token}` }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axiosAuth.get("/cabang");
      setList(res.data.data || []);
    } catch (err) {
      message.error("Gagal memuat data cabang");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCabangModal = (record = null) => {
    setEditingCabang(record);
    form.resetFields();
    if (record) {
      form.setFieldsValue({
        nama_cabang: record.nama_cabang,
        alamat_cabang: record.alamat_cabang,
        status_cabang: record.status_cabang,
        foto_cabang: record.foto_cabang
          ? [{ uid: record.id_cabang, name: record.foto_cabang, status: "done", url: `/assets/cabang/${record.foto_cabang}` }]
          : []
      });
    } else {
      form.setFieldsValue({ status_cabang: true });
    }
    setModalVisible(true);
  };

  const handleCabangSubmit = async () => {
    try {
      const values = await form.validateFields();
      const fd = new FormData();

      if (editingCabang) {
        fd.append("id_cabang", editingCabang.id_cabang);
      }
      Object.entries(values).forEach(([k, v]) => {
        if (k === "foto_cabang" && v && v[0]?.originFileObj) {
          fd.append("foto_cabang", v[0].originFileObj);
        } else if (k !== "foto_cabang") {
          fd.append(k, v);
        }
      });

      const method = editingCabang ? "put" : "post";
      await axiosAuth[method]("/cabang", fd);
      message.success(editingCabang ? "Cabang berhasil diperbarui" : "Cabang berhasil ditambahkan");
      setModalVisible(false);
      loadData();
    } catch (e) {
      if (e.errorFields) {
        message.error("Validasi gagal, silakan periksa kembali isian Anda.");
      } else {
        message.error(e.response?.data?.message || "Terjadi kesalahan saat menyimpan data cabang.");
      }
    }
  };

  const openRuanganModal = (record = null, cabangId = null) => {
    const currentCabangId = record?.id_cabang || cabangId;
    setEditingRuangan(record ? { ...record, id_cabang: currentCabangId } : { id_cabang: currentCabangId });
    formRuangan.resetFields();
    if (record) {
      formRuangan.setFieldsValue(record);
    } else {
      formRuangan.setFieldsValue({ status_ruangan: true });
    }
    setModalRuanganVisible(true);
  };

  const handleRuanganSubmit = async () => {
    try {
      const values = await formRuangan.validateFields();
      const payload = { ...values, id_cabang: editingRuangan.id_cabang };
      if (editingRuangan.id_ruangan) {
        payload.id_ruangan = editingRuangan.id_ruangan;
      }
      const method = editingRuangan.id_ruangan ? "put" : "post";
      await axiosAuth[method]("/ruangan", payload);
      message.success(editingRuangan.id_ruangan ? "Ruangan berhasil diperbarui" : "Ruangan berhasil ditambahkan");
      setModalRuanganVisible(false);
      // Reload data ruangan untuk cabang yang sedang di-expand
      await handleExpand(true, { id_cabang: editingRuangan.id_cabang }, true);
    } catch (e) {
      if (e.errorFields) {
        message.error("Validasi gagal, silakan periksa kembali isian Anda.");
      } else {
        message.error(e.response?.data?.message || "Gagal menyimpan ruangan");
      }
    }
  };

  const handleExpand = async (expanded, record, forceReload = false) => {
    const { id_cabang } = record;
    if (expanded) {
      setExpandedRowKeys([id_cabang]);
      if (!ruanganMap[id_cabang] || forceReload) {
        setLoadingRuangan(prev => ({ ...prev, [id_cabang]: true }));
        try {
          const res = await axiosAuth.get(`/ruangan/${id_cabang}`);
          setRuanganMap(prev => ({ ...prev, [id_cabang]: res.data.data || [] }));
        } catch (err) {
          message.error("Gagal memuat data ruangan");
        } finally {
          setLoadingRuangan(prev => ({ ...prev, [id_cabang]: false }));
        }
      }
    } else {
      setExpandedRowKeys([]);
    }
  };

  const columns = [
    { title: "No.", render: (_, __, i) => i + 1, width: 60 },
    {
      title: "Gambar Cabang", dataIndex: "foto_cabang",
      render: (v) => v ? <img src={`/assets/cabang/${v}`} style={{ width: 80, height: 60, objectFit: "cover" }} alt="cabang" /> : "-",
      width: 140
    },
    { title: "Nama Cabang", dataIndex: "nama_cabang", width: 150 },
    { title: "Alamat", dataIndex: "alamat_cabang" },
    { title: "Status Aktif", dataIndex: "status_cabang", render: (st) => <StatusTag value={st} />, width: 120 },
    {
      title: "Aksi",
      render: (_, cabangRecord) => (
        <TableActionButtons 
          onEdit={() => openCabangModal(cabangRecord)} 
          // --- PERBAIKAN 1: Mencegah penambahan ruangan pada cabang nonaktif ---
          onAdd={() => {
            if (!cabangRecord.status_cabang) {
              message.warning("Tidak dapat menambah ruangan pada cabang yang tidak aktif.");
              return;
            }
            openRuanganModal(null, cabangRecord.id_cabang)
          }} 
          addText="Ruangan" 
        />
      ),
      width: 160
    }
  ];

  const expandedRowRender = (cabangRecord) => { // Beri nama parameter yang jelas
    const isLoading = loadingRuangan[cabangRecord.id_cabang];
    const ruanganList = ruanganMap[cabangRecord.id_cabang] || [];
    return (
      <Spin spinning={isLoading}>
        <Table // Ini adalah tabel untuk Ruangan
          dataSource={ruanganList}
          rowKey="id_ruangan"
          columns={[
            { title: "No.", render: (_, __, i) => i + 1, width: 60 },
            { title: "Nama Ruangan", dataIndex: "nama_ruangan", width: 300 },
            {
              title: "Status Aktif",
              // --- PERBAIKAN 2: Tampilkan status efektif ruangan ---
              render: (ruanganRecord) => (
                <StatusTag value={cabangRecord.status_cabang && ruanganRecord.status_ruangan} />
              ),
              width: 200
            },
            { title: "Aksi", render: (_, r) => <Button icon={<EditOutlined />} onClick={() => openRuanganModal(r, cabangRecord.id_cabang)} />, width: 200 }
          ]}
          bordered
          pagination={false}
        />
      </Spin>
    );
  };

  return (
    <div style={{ padding: 24, background: "#fff", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2>Pengelolaan Cabang & Ruangan</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCabangModal()}>
          Tambah Cabang
        </Button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <Table
          columns={columns}
          dataSource={list}
          rowKey="id_cabang"
          loading={loading}
          expandable={{ expandedRowKeys, onExpand: handleExpand, expandedRowRender }}
          scroll={{ x: "max-content" }}
          bordered
        />
      </div>

      {/* --- MODAL CABANG DENGAN VALIDASI --- */}
      <ModalWrapper
        title={editingCabang ? "Edit Cabang" : "Tambah Cabang"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleCabangSubmit}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="Gambar Cabang"
            name="foto_cabang"
            valuePropName="value"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}
            rules={[{ required: !editingCabang, message: "Gambar Cabang wajib diunggah" }]}
          >
            <FormUploadImage />
          </Form.Item>
          <Form.Item
            name="nama_cabang"
            label="Nama Cabang"
            rules={[
              { required: true, message: "Nama Cabang wajib diisi" },
              { min: 4, message: "Nama Cabang minimal harus 4 karakter" }
            ]}
          >
            <Input placeholder="Contoh: Sarijadi" />
          </Form.Item>
          <Form.Item
            name="alamat_cabang"
            label="Alamat Cabang"
            rules={[
              { required: true, message: "Alamat Cabang wajib diisi" },
              { min: 10, message: "Alamat Cabang minimal harus 10 karakter" }
            ]}
          >
            <Input.TextArea rows={3} placeholder="Masukkan alamat lengkap cabang" />
          </Form.Item>
          <Form.Item
            name="status_cabang"
            label="Status"
            rules={[{ required: true, message: "Status Cabang wajib dipilih" }]}
          >
            <Radio.Group>
              <Radio value={true}>Aktif</Radio>
              <Radio value={false}>Nonaktif</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </ModalWrapper>

      {/* --- MODAL RUANGAN DENGAN VALIDASI --- */}
      <ModalWrapper
        title={editingRuangan?.id_ruangan ? "Edit Ruangan" : "Tambah Ruangan"}
        open={modalRuanganVisible}
        onCancel={() => setModalRuanganVisible(false)}
        onOk={handleRuanganSubmit}
      >
        <Form form={formRuangan} layout="vertical" preserve={false}>
          <Form.Item
            name="nama_ruangan"
            label="Nama Ruangan"
            rules={[
              { required: true, message: "Nama Ruangan wajib diisi" },
              { min: 3, message: "Nama Ruangan minimal harus 3 karakter" },
              { pattern: /^[a-zA-Z0-9\s]+$/, message: "Nama Ruangan hanya boleh berisi huruf dan angka" }
            ]}
          >
            <Input placeholder="Contoh: Ruangan 1" />
          </Form.Item>
          <Form.Item
            name="status_ruangan"
            label="Status"
            rules={[{ required: true, message: "Status Ruangan wajib dipilih" }]}
          >
            <Radio.Group>
              <Radio value={true}>Aktif</Radio>
              <Radio value={false}>Nonaktif</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </ModalWrapper>
    </div>
  );
};

export default CabangRuanganPage;