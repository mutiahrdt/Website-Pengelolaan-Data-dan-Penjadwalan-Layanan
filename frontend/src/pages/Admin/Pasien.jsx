// File: src/pages/PasienPage.jsx (LENGKAP & DIPERBAIKI)

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import TableActionButtons from '../../components/TableActionButtons';
import ModalWrapper from '../../components/ModalWrapper';

dayjs.locale('id');
const { Option } = Select;

const axiosAuth = axios.create({ baseURL: '/api' });
axiosAuth.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));


export default function PasienPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axiosAuth.get('/pasien');
      setList(res.data.data || []);
    } catch (e) {
      message.error(`Gagal memuat data pasien: ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // PERBAIKAN DI SINI
  const openModal = (record = null) => {
    form.resetFields(); // Ini sudah cukup untuk membersihkan form saat 'Tambah'
    setEditing(record);

    if (record) {
      // Jika mode edit, isi form dengan data yang ada
      form.setFieldsValue({
        ...record,
        tanggal_lahir: record.tanggal_lahir ? dayjs(record.tanggal_lahir, 'YYYY-MM-DD') : null,
      });
    }
    // Blok 'else' untuk mengatur nilai default telah dihapus
    
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        tanggal_lahir: values.tanggal_lahir ? values.tanggal_lahir.format('YYYY-MM-DD') : null,
      };

      setLoading(true);
      setModalVisible(false);

      if (editing) {
        message.loading({ content: 'Memperbarui data pasien...', key: 'update' });
        await axiosAuth.put(`/pasien/${editing.id_pasien}`, payload);
        message.success({ content: 'Pasien berhasil diperbarui!', key: 'update' });
      } else {
        message.loading({ content: 'Menambahkan pasien baru...', key: 'add' });
        await axiosAuth.post('/pasien', payload);
        message.success({ content: 'Pasien berhasil ditambahkan!', key: 'add' });
      }
      
      await loadData();

    } catch (e) {
      message.error(e.response?.data?.message || 'Gagal menyimpan data pasien.');
      setModalVisible(true);
    } finally {
        setLoading(false);
    }
  };

  const columns = [
    { title: 'No.', render: (_, __, i) => i + 1, width: 60, fixed: 'left' },
    { title: 'Nama Pasien', dataIndex: 'nama_pasien', width: 200 },
    { title: 'Nomor HP', dataIndex: 'no_hp_pasien', width: 150 },
    {
      title: 'Jenis Kelamin',
      dataIndex: 'gender_pasien',
      render: (v) => (v === 'L' ? 'Laki-laki' : 'Perempuan'),
      width: 120,
    },
    {
      title: 'Tanggal Lahir',
      dataIndex: 'tanggal_lahir',
      render: (val) => val ? dayjs(val).format('DD MMMM YYYY') : '-',
      width: 150,
    },
    {
      title: 'Aksi',
      key: 'aksi',
      render: (_, record) => <TableActionButtons onEdit={() => openModal(record)} />,
      width: 80,
      fixed: 'right'
    }
  ];

  return (
    <div style={{ padding: 24, background: '#fff', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Pengelolaan Data Pasien</h2>
        <Button icon={<PlusOutlined />} type="primary" onClick={() => openModal()}>
          Tambah
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={list}
        rowKey="id_pasien"
        loading={loading}
        bordered
        scroll={{ x: 'max-content' }}
      />

      <ModalWrapper
        title={editing ? 'Edit Pasien' : 'Tambah Pasien'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={450}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="nama_pasien"
            label="Nama Pasien"
            rules={[{ required: true, message: 'Nama wajib diisi' }]}
          >
            <Input placeholder="Masukkan nama lengkap pasien" />
          </Form.Item>
          
          <Form.Item
              name="no_hp_pasien"
              label="No. Handphone"
              rules={[
                  { required: true, message: 'No HP wajib diisi' },
                  { pattern: /^[0-9]+$/, message: 'No HP hanya boleh berisi angka' }
              ]}
          >
              <Input placeholder="Contoh: 08123456789" />
          </Form.Item>

          <Form.Item
              name="gender_pasien"
              label="Jenis Kelamin"
              rules={[{ required: true, message: 'Jenis kelamin wajib dipilih' }]}
          >
              <Select placeholder="Pilih jenis kelamin">
                <Option value="L">Laki-laki</Option>
                <Option value="P">Perempuan</Option>
              </Select>
          </Form.Item>
          
          <Form.Item
            name="tanggal_lahir"
            label="Tanggal Lahir"
            rules={[{ required: true, message: 'Tanggal lahir wajib diisi' }]}
          >
            <DatePicker 
                format="DD MMMM YYYY" 
                style={{ width: '100%' }}
                placeholder="Pilih tanggal lahir"
                picker="date"
            />
          </Form.Item>
        </Form>
      </ModalWrapper>
    </div>
  );
}