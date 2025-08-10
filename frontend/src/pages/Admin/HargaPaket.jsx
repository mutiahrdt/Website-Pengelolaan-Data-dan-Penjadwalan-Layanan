import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { Table, Button, Form, Input, Select, DatePicker, Radio, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import StatusTag from '../../components/StatusTag';
import ModalWrapper from '../../components/ModalWrapper';
import TableActionButtons from '../../components/TableActionButtons';

const { Option } = Select;

const axiosAuth = axios.create({ baseURL: '/api' });
axiosAuth.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default function HargaPaketPage() {
  const [list, setList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [paketOptions, setPaketOptions] = useState([]);
  const [historiHarga, setHistoriHarga] = useState({});
  const [cabangOptions, setCabangOptions] = useState([]);
  const [form] = Form.useForm();

  const idCabang = localStorage.getItem('id_cabang');
  const role = localStorage.getItem('role');

  const loadData = async () => {
    try {
      const [resHarga, resPaket, resCabang] = await Promise.all([
        axiosAuth.get('/harga-paket'),
        axiosAuth.get('/paket'),
        axiosAuth.get('/cabang')
      ]);
      setList(resHarga.data.data || []);
      setPaketOptions(resPaket.data.data || []);
      setCabangOptions((resCabang.data.data || []).map(c => ({ value: c.id_cabang, label: c.nama_cabang })));
    } catch (e) {
      message.error(e.response?.data?.message || 'Gagal memuat data.');
    }
  };

  useEffect(() => { loadData(); }, []);

  const loadHistoriHarga = async (id_cabang, id_paket) => {
    const key = `${id_cabang}_${id_paket}`;
    if (historiHarga[key]) return;
    try {
      const res = await axiosAuth.get(`/harga-paket/histori/${id_cabang}/${id_paket}`);
      setHistoriHarga(prev => ({ ...prev, [key]: res.data.data || [] }));
    } catch {
      setHistoriHarga(prev => ({ ...prev, [key]: [] }));
    }
  };

  const openModal = (record) => {
    setEditing(record || null);
    form.resetFields();
    if (record) {
      loadHistoriHarga(record.id_cabang, record.id_paket);
      form.setFieldsValue({
        id_cabang: record.id_cabang,
        id_paket: record.id_paket,
        harga_paket: Number(record.harga_paket || 0),
        waktu_berlaku: dayjs(),
        status_harga_paket: record.status_harga_paket ?? true
      });
    } else {
      form.setFieldsValue({
        id_cabang: role === "Admin" ? idCabang : undefined,
        waktu_berlaku: dayjs(),
        status_harga_paket: true
      });
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const allValues = form.getFieldsValue(true);

      const payload = {
        harga_paket: parseFloat(allValues.harga_paket),
        waktu_berlaku: allValues.waktu_berlaku.toISOString(),
        id_cabang: editing ? editing.id_cabang : (role === "Admin" ? idCabang : allValues.id_cabang),
        id_paket: editing ? editing.id_paket : allValues.id_paket,
        status_harga_paket: allValues.status_harga_paket ?? true
      };

      await axiosAuth.post('/harga-paket', payload);
      message.success(editing ? "Harga baru berhasil ditetapkan" : "Harga baru berhasil ditambahkan");

      setModalVisible(false);
      await loadData();

      const keyAffected = `${payload.id_cabang}_${payload.id_paket}`;
      setHistoriHarga(prev => {
        const newHistori = { ...prev };
        delete newHistori[keyAffected];
        return newHistori;
      });

    } catch (err) {
      if (err.errorFields) {
        message.error("Validasi gagal, silakan periksa kembali isian Anda.");
      } else {
        console.error("Error saat menyimpan:", err);
        message.error(err.response?.data?.message || err.message || 'Gagal menyimpan data harga.');
      }
    }
  };

  const columns = [
    { title: 'No.', render: (_, __, i) => i + 1, width: 60 },
    {
      title: 'Gambar', dataIndex: 'gambar_paket', width: 90,
      render: (_, rec) => rec.gambar_paket ? <img src={`/assets/paket/${rec.gambar_paket}`} alt="paket" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ width: 60, height: 60, background: '#f5f5f5', borderRadius: 8 }} />
    },
    { title: 'Nama Paket', dataIndex: 'nama_paket' },
    { title: 'Durasi', dataIndex: 'durasi_paket', render: (d) => d ? `${d} Menit` : '-', width: 100 },
    { title: "Keterangan", dataIndex: "deskripsi_paket", render: text => text || "-", width: 160 },
    { title: "Kata Kunci", dataIndex: "kata_kunci", render: text => text || "-", width: 160 },
    { title: 'Harga', dataIndex: 'harga_paket', render: val => (val != null) ? `Rp ${Number(val).toLocaleString('id-ID')}` : '-', width: 150 },
    { title: 'Status Aktif', dataIndex: 'status_harga_paket', render: (val) => <StatusTag value={val} />, width: 120 },
    { title: 'Aksi', render: (_, rec) => <TableActionButtons onEdit={() => openModal(rec)} editText="Ganti Harga" />, width: 120 }
  ];

  const expandedRowRender = (rec) => {
    const key = `${rec.id_cabang}_${rec.id_paket}`;
    const histori = historiHarga[key] || [];
    return (
      <Table
        dataSource={histori}
        columns={[
          { title: 'No.', render: (_, __, i) => i + 1, width: 60 },
          { title: 'Harga', dataIndex: 'harga_paket', render: val => (val != null) ? `Rp ${Number(val).toLocaleString('id-ID')}` : '-' },
          { title: 'Waktu Berlaku', dataIndex: 'waktu_berlaku', render: val => val ? dayjs(val).format('DD MMM YYYY HH:mm') : '-' },
          { title: 'Status', dataIndex: 'status_harga_paket', render: (val) => <StatusTag value={val} /> }
        ]}
        rowKey="waktu_berlaku"
        pagination={false}
        size="small"
      />
    );
  };

  const handleNumberInput = (e) => {
    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      message.warn('Input hanya menerima angka.', 0.5);
    }
  };

  return (
    <div style={{ padding: 24, background: '#fff', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Pengelolaan Harga Paket</h2>
        <Button icon={<PlusOutlined />} type="primary" onClick={() => openModal()}>Tambah Harga</Button>
      </div>
      <Table
        columns={columns}
        dataSource={list}
        rowKey={row => `${row.id_cabang}_${row.id_paket}_${row.waktu_berlaku}`}
        expandable={{
          expandedRowRender,
          onExpand: (expanded, record) => { if (expanded) loadHistoriHarga(record.id_cabang, record.id_paket); },
        }}
        bordered
        scroll={{ x: 'max-content' }}
      />
      <ModalWrapper title={editing ? `Ganti Harga untuk ${editing.nama_paket}` : 'Tambah Harga Baru'} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleSubmit} width={450} destroyOnClose>
        <Form form={form} layout="vertical">
          {role === "Superadmin" && (
            <Form.Item name="id_cabang" label="Cabang" rules={[{ required: true, message: "Cabang wajib dipilih" }]}>
              <Select showSearch options={cabangOptions} placeholder="Pilih cabang" disabled={!!editing} />
            </Form.Item>
          )}
          <Form.Item name="id_paket" label="Paket" rules={[{ required: true, message: "Paket wajib dipilih" }]}>
            <Select showSearch placeholder="Pilih paket" disabled={!!editing}>
              {paketOptions.map(p => <Option key={p.id_paket} value={p.id_paket}>{p.nama_paket}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item
            name="harga_paket"
            label="Harga Paket (Rp)"
            rules={[
              { required: true, message: "Harga Paket wajib diisi" },
              { pattern: /^[1-9][0-9]*$/, message: "Harga harus berupa angka bulat positif" }
            ]}
          >
            <Input type="text" inputMode="numeric" onKeyDown={handleNumberInput} placeholder="Masukkan harga baru" />
          </Form.Item>
          <Form.Item
            name="waktu_berlaku"
            label="Waktu Berlaku"
            rules={[{ required: true, message: "Waktu Mulai Berlaku wajib dipilih" }]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} placeholder="Pilih tanggal dan jam" />
          </Form.Item>
          <Form.Item
            name="status_harga_paket"
            label="Status"
            rules={[{ required: true, message: "Status wajib dipilih" }]}
          >
            <Radio.Group>
              <Radio value={true}>Aktif</Radio>
              <Radio value={false}>Tidak Aktif</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </ModalWrapper>
    </div>
  );
}
