// File: src/pages/JamKerjaPage.jsx (LENGKAP, FINAL & SESUAI)

import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  Table, Button, Modal, Form, InputNumber, Select,
  DatePicker, Space, message, Radio, Row, Col
} from 'antd';
import { PlusOutlined } from "@ant-design/icons";
import StatusTag from '../../components/StatusTag';
import TableActionButtons from '../../components/TableActionButtons';

dayjs.locale('id');

const { Option } = Select;
const { RangePicker } = DatePicker;

// Setup instance axios dengan interceptor untuk token
const axiosAuth = axios.create({ baseURL: '/api' });
axiosAuth.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// --- Fungsi Utilitas (Tidak ada perubahan) ---
const generateTahunOptions = () => {
  const currentYear = new Date().getFullYear();
  const options = [];
  for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    options.push({ value: year, label: year });
  }
  return options;
};

const triwulanData = [
  { value: 1, label: 'Triwulan 1 (Jan - Mar)' },
  { value: 2, label: 'Triwulan 2 (Apr - Jun)' },
  { value: 3, label: 'Triwulan 3 (Jul - Sep)' },
  { value: 4, label: 'Triwulan 4 (Okt - Des)' },
];

const getTriwulanDateRange = (triwulanStr) => {
  if (!triwulanStr || !triwulanStr.includes('Q')) return null;
  const [tahun, kuartal] = triwulanStr.split('Q');
  const startMonth = (parseInt(kuartal) - 1) * 3;
  const startDate = dayjs(new Date(tahun, startMonth, 1));
  const endDate = startDate.add(2, 'month').endOf('month');
  return { startDate, endDate };
};

const getBulanFromTriwulan = (triwulanStr) => {
  const range = getTriwulanDateRange(triwulanStr);
  if (!range) return [];
  return [
    range.startDate.format('MMMM'),
    range.startDate.add(1, 'month').format('MMMM'),
    range.startDate.add(2, 'month').format('MMMM'),
  ];
};

export default function JamKerjaPage() {
  const [semuaJamKerja, setSemuaJamKerja] = useState([]);
  const [daftarTerapis, setDaftarTerapis] = useState([]);
  const [daftarSif, setDaftarSif] = useState([]);
  const [modalTerlihat, setModalTerlihat] = useState(false);
  const [dataDiubah, setDataDiubah] = useState(null);
  const [filterPeriode, setFilterPeriode] = useState([dayjs().startOf('year'), dayjs().endOf('year')]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  const hariKerjaOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const tahunOptions = generateTahunOptions();

  const muatData = async () => {
    setLoading(true);
    try {
      const [resJamKerja, resTerapis, resSif] = await Promise.all([
        axiosAuth.get('/jam-kerja'),
        axiosAuth.get('/terapis?status=true'),
        axiosAuth.get('/sif?status=true'),
      ]);
      setSemuaJamKerja(resJamKerja.data.data || []);
      setDaftarTerapis(resTerapis.data.data || []);
      setDaftarSif(resSif.data.data || []);
    } catch (err) {
      message.error("Gagal memuat data: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    muatData();
  }, []);

  const bukaModal = (record = null) => {
    form.resetFields();
    setDataDiubah(record);
    if (record) {
      const [tahun, kuartal] = record.triwulan.split('Q');
      form.setFieldsValue({
        id_terapis: record.id_terapis,
        id_sif: record.id_sif,
        hari_kerja: record.hari_kerja,
        kuota_jam_kerja: record.kuota_jam_kerja,
        triwulan_kuartal: parseInt(kuartal),
        triwulan_tahun: parseInt(tahun),
        status_bekerja: record.status_bekerja,
      });
    } else {
      form.setFieldsValue({
        status_bekerja: true,
        triwulan_tahun: dayjs().year(),
      });
    }
    setModalTerlihat(true);
  };
  
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const payloadValues = { 
        ...values, 
        triwulan: `${values.triwulan_tahun}Q${values.triwulan_kuartal}`,
      };
      // Tidak perlu menghapus `status_bekerja` karena backend membutuhkannya
      delete payloadValues.triwulan_kuartal;
      delete payloadValues.triwulan_tahun;

      setModalTerlihat(false);
      message.loading({ content: dataDiubah ? 'Memperbarui...' : 'Menambahkan...', key: 'submit' });

      if (dataDiubah) {
        // --- MODE UPDATE ---
        const payloadKeys = {
          id_terapis: dataDiubah.id_terapis,
          id_sif: dataDiubah.id_sif,
          hari_kerja: dataDiubah.hari_kerja,
          triwulan: dataDiubah.triwulan,
        };
        // Mengirim ke endpoint PUT yang baru dengan format { keys, values }
        await axiosAuth.put(`/jam-kerja`, { keys: payloadKeys, values: payloadValues });

      } else {
        // --- MODE CREATE ---
        await axiosAuth.post('/jam-kerja', payloadValues);
      }
      
      message.success({ content: `Jam kerja berhasil ${dataDiubah ? 'diperbarui' : 'ditambahkan'}!`, key: 'submit' });
      await muatData();

    } catch (err) {
      message.destroy('submit');
      if (err.errorFields) {
        message.error("Validasi gagal, silakan periksa kembali isian Anda.");
      } else {
        message.error(err.response?.data?.message || "Gagal menyimpan data.");
      }
    }
  };

  const daftarTergrup = useMemo(() => {
    const dataTersaring = semuaJamKerja.filter(jk => {
      if (!filterPeriode || !filterPeriode[0] || !filterPeriode[1]) return true;
      const rangeTriwulan = getTriwulanDateRange(jk.triwulan);
      if (!rangeTriwulan) return false;
      const filterMulai = filterPeriode[0].startOf('month');
      const filterSelesai = filterPeriode[1].endOf('month');
      return rangeTriwulan.startDate.isBefore(filterSelesai) && rangeTriwulan.endDate.isAfter(filterMulai);
    });

    const grup = dataTersaring.reduce((acc, curr) => {
      // Pastikan ada id_terapis sebelum memproses
      if (!curr.id_terapis) return acc;
      
      const key = curr.id_terapis;
      if (!acc[key]) {
        acc[key] = {
          ...curr, // Ambil data terapis dari entri pertama
          semua_hari_kerja: new Set(),
          semua_periode: new Set(),
          detail: [],
        };
      }
      acc[key].semua_hari_kerja.add(curr.hari_kerja);
      acc[key].semua_periode.add(curr.triwulan);
      acc[key].detail.push(curr);
      return acc;
    }, {});
    
    return Object.values(grup).map(item => ({
        ...item,
        hari_kerja_str: [...item.semua_hari_kerja].join(', '),
        periode_str: [...item.semua_periode].map(t => `Triwulan ${t.slice(-1)} ${t.slice(0, 4)}`).join(', '),
    }));
  }, [semuaJamKerja, filterPeriode]);

  const mainColumns = [
    { title: 'No.', render: (_, __, i) => i + 1, width: 60},
    { title: 'Nama Terapis', dataIndex: 'nama_terapis', sorter: (a,b) => a.nama_terapis.localeCompare(b.nama_terapis) },
    { title: 'Inisial', dataIndex: 'inisial_terapis', width: 80 },
    { title: 'Hari Kerja', dataIndex: 'hari_kerja_str', width: 250 },
    { title: 'Periode', dataIndex: 'periode_str' },
  ];

  const expandedColumns = [
    { title: 'No.', render: (_, __, i) => i + 1, width: 60 },
    { title: 'Hari Kerja', dataIndex: 'hari_kerja' },
    { title: 'Sif', dataIndex: 'nama_sif' },
    { title: 'Kuota Jam Kerja', dataIndex: 'kuota_jam_kerja', render: j => `${j} Jam` },
    { 
      title: 'Periode', dataIndex: 'triwulan', 
      render: t => (<div>{`Triwulan ${t.slice(-1)} ${t.slice(0, 4)}`}<br /><small style={{ color: '#888', fontStyle: 'italic' }}>({getBulanFromTriwulan(t).join(', ')})</small></div>)
    },
    { title: 'Status', dataIndex: 'status_bekerja', render: s => <StatusTag value={s} /> },
    { title: 'Aksi', key: 'aksi', render: (_, record) => <TableActionButtons onEdit={() => bukaModal(record)} /> }
  ];

  return (
    <div style={{ padding: 24, background: '#fff', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Pengelolaan Jam Kerja Terapis</h2>
        <Space>
          <RangePicker picker="month" value={filterPeriode} onChange={setFilterPeriode} allowClear />
          <Button icon={<PlusOutlined />} type="primary" onClick={() => bukaModal()}>Tambah</Button>
        </Space>
      </div>

      <Table
        dataSource={daftarTergrup}
        loading={loading}
        rowKey="id_terapis"
        bordered
        scroll={{ x: 'max-content' }}
        columns={mainColumns}
        expandable={{
          expandedRowRender: parent => (
            <Table 
              dataSource={parent.detail} 
              pagination={false} 
              // Memastikan rowKey benar-benar unik dengan menggabungkan seluruh Primary Key
              rowKey={d => `${d.id_terapis}-${d.id_sif}-${d.hari_kerja}-${d.triwulan}`} 
              columns={expandedColumns} 
            />
          )
        }}
      />

      <Modal
        title={dataDiubah ? 'Perbarui Jam Kerja' : 'Tambah Jam Kerja'}
        open={modalTerlihat}
        onCancel={() => setModalTerlihat(false)}
        onOk={handleSubmit}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" initialValues={{ status_bekerja: true }}>
          <Form.Item name="id_terapis" label="Terapis" rules={[{ required: true, message: 'Terapis wajib dipilih' }]}>
            <Select placeholder="Pilih Terapis" disabled={!!dataDiubah} showSearch filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
              {daftarTerapis.map(t => <Option key={t.id_terapis} value={t.id_terapis}>{t.nama_terapis}</Option>)}
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="triwulan_kuartal" label="Periode" rules={[{ required: true, message: 'Triwulan wajib dipilih' }]}>
                <Select placeholder="Pilih Kuartal" options={triwulanData} disabled={!!dataDiubah} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="triwulan_tahun" label="Tahun" rules={[{ required: true, message: 'Tahun wajib dipilih' }]}>
                <Select placeholder="Pilih Tahun" options={tahunOptions} disabled={!!dataDiubah} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="id_sif" label="Sif" rules={[{ required: true, message: 'Sif kerja wajib dipilih' }]}>
                <Select placeholder="Pilih Sif" disabled={!!dataDiubah}>
                  {daftarSif.map(s => <Option key={s.id_sif} value={s.id_sif}>{`${s.nama_sif} (${s.jam_mulai} - ${s.jam_selesai})`}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="hari_kerja" label="Hari Kerja" rules={[{ required: true, message: 'Hari kerja wajib dipilih' }]}>
                <Select placeholder="Pilih Hari" disabled={!!dataDiubah}>
                  {hariKerjaOptions.map(h => <Option key={h} value={h}>{h}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item 
            name="kuota_jam_kerja" 
            label="Kuota Jam Kerja (per hari)" 
            rules={[
              { required: true, message: 'Kuota Jam Kerja wajib diisi' },
              { type: 'number', min: 1, max: 12, message: 'Kuota harus antara 1-12 jam' }
            ]}
          >
            <InputNumber min={1} max={12} style={{ width: '100%' }} addonAfter="Jam" placeholder="Masukkan kuota jam per hari" />
          </Form.Item>
          
          <Form.Item 
            name="status_bekerja" 
            label="Status Bekerja" 
            rules={[{ required: true, message: 'Status Bekerja wajib dipilih' }]}
            tooltip="Nonaktifkan jika terapis tidak lagi bekerja pada jadwal ini."
          >
            <Radio.Group>
              <Radio value={true}>Aktif</Radio>
              <Radio value={false}>Nonaktif</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}