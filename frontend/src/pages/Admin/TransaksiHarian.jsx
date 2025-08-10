import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Table, Button, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import InformasiFormModal from '../../components/InformasiFormModal';
import StatusTag from '../../components/StatusTag'; // Asumsi Anda punya komponen ini

dayjs.locale('id');

const axiosAuth = axios.create({ baseURL: '/api' });
axiosAuth.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Mapping warna untuk status agar konsisten
const statusColorMapping = {
  'tersedia': 'default',
  'terisi': 'processing',
  'dibatalkan mr': 'error',
  'dibatalkan pasien': 'warning',
  'terlaksana': 'success'
};

export default function TransaksiHarianPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [options, setOptions] = useState({ jadwal: [], form: [] });
  const navigate = useNavigate();
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [resList, resOptions] = await Promise.all([
        axiosAuth.get('/transaksi-harian'),
        axiosAuth.get('/transaksi-harian/options'),
      ]);
      setList(resList.data.data || []);
      setOptions(resOptions.data.data || { jadwal: [], form: [] });
    } catch (e) {
      message.error(`Gagal memuat data: ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      const { id_pesanan, forms } = values;
      if (!forms || forms.length === 0) {
        message.warn('Tidak ada informasi yang ditambahkan.');
        setSubmitLoading(false);
        return;
      }
      message.loading({ content: 'Menyimpan semua informasi...', key: 'submit' });
      for (const item of forms) {
        if (!item || !item.id_form || item.informasi === undefined) continue;
        const selectedForm = options.form.find(f => f.value === item.id_form);
        const tipeData = selectedForm?.tipeData;
        const formData = new FormData();
        formData.append('id_pesanan', id_pesanan);
        formData.append('id_form', item.id_form);
        formData.append('tipe_data', tipeData);
        if (tipeData === 'upload') {
          if (item.informasi?.[0]?.originFileObj) {
            formData.append('informasi_file', item.informasi[0].originFileObj);
          }
        } else {
          if (item.informasi !== null && item.informasi !== undefined) {
            formData.append('informasi', item.informasi);
          }
        }
        await axiosAuth.post('/transaksi-harian', formData);
      }
      setModalVisible(false);
      message.success({ content: 'Semua informasi berhasil disimpan!', key: 'submit' });
      loadData();
    } catch (e) {
      message.destroy('submit');
      message.error(e.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    { title: 'No.', render: (_, __, i) => i + 1, width: 60, fixed: 'left' },
    { title: 'Kode Pasien', dataIndex: 'kode_pasien', width: 150 },
    { title: 'Nama Pasien', dataIndex: 'nama_pasien', ellipsis: true },
    {
      title: 'Jadwal Terakhir',
      dataIndex: 'tanggal_terakhir',
      render: (tanggal) => tanggal ? dayjs(tanggal).format('DD MMM YYYY') : '-',
      width: 150,
      sorter: (a, b) => new Date(a.tanggal_terakhir) - new Date(b.tanggal_terakhir),
    },
    {
      title: 'Status Terakhir',
      dataIndex: 'status_terakhir',
      render: (status) => {
        if (!status) return <Tag>Belum Ada Jadwal</Tag>;
        // Gunakan komponen StatusTag jika ada, atau Tag biasa jika tidak
        return StatusTag ? <StatusTag value={status} /> : (
          <Tag color={statusColorMapping[status.toLowerCase()] || 'default'}>
            {status}
          </Tag>
        );
      },
      width: 180,
      filters: [
          { text: 'Terlaksana', value: 'Terlaksana' },
          { text: 'Terisi', value: 'Terisi' },
          { text: 'Dibatalkan Pasien', value: 'dibatalkan pasien' },
          { text: 'Dibatalkan MR', value: 'dibatalkan MR' },
      ],
      onFilter: (value, record) => record.status_terakhir === value,
    },
    {
      title: 'Aksi',
      key: 'detail',
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          disabled={!record.id_pesanan} // Nonaktifkan tombol jika tidak ada pesanan
          onClick={() => record.id_pesanan && navigate(`/transaksi-harian/detail/${record.id_pesanan}`)}
        >
          Lihat Riwayat
        </Button>
      ),
      width: 150,
      fixed: 'right'
    },
  ];

  return (
    <div style={{ padding: 24, background: '#fff', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Riwayat Transaksi Pasien</h2>
        <Button icon={<PlusOutlined />} type="primary" onClick={() => setModalVisible(true)}>
          Tambah Informasi
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={list} 
        rowKey="kode_pasien" 
        loading={loading} 
        bordered 
        scroll={{ x: 'max-content' }}
      />
      
      <InformasiFormModal
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        options={options}
        loading={submitLoading}
      />
    </div>
  );
}