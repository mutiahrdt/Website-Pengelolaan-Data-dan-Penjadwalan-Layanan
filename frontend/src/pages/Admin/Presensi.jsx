import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  Table, Button, Select, DatePicker, Form, message, Space, TimePicker, Tag,
  Modal, List, Typography // <-- Impor komponen baru
} from 'antd';
import { 
    SaveOutlined, EditOutlined, CloseCircleOutlined,
    CheckCircleOutlined, WarningOutlined // <-- Impor ikon baru
} from '@ant-design/icons';

dayjs.locale('id');
dayjs.extend(customParseFormat);
const { Option } = Select;
const { Text } = Typography;

// Axios instance dengan interceptor untuk token autentikasi
const axiosAuth = axios.create({ baseURL: '/api' });
axiosAuth.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Komponen sel yang bisa diedit di dalam tabel
const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  children,
  ...restProps
}) => {
  if (!record) {
    return <td {...restProps}>{children}</td>;
  }

  const recordKey = record.id_terapis;
  const form = Form.useFormInstance();
  // Gunakan Form.useWatch untuk melacak perubahan status secara real-time
  const status = Form.useWatch([recordKey, 'status_kehadiran'], form);

  let inputNode = children;

  if (editing) {
    if (inputType === 'status') {
      inputNode = (
        <Select
          placeholder="Pilih status"
          style={{ width: '100%' }}
          onChange={() => {
            // Reset field lain saat status diubah
            form.setFieldsValue({
              [recordKey]: {
                waktu_kehadiran: null,
                keterangan_kehadiran: undefined,
              },
            });
          }}
        >
          <Option value={true}>Hadir</Option>
          <Option value={false}>Tidak Hadir</Option>
        </Select>
      );
    } else if (inputType === 'waktu_kehadiran') {
      inputNode = (
        <TimePicker
          format="HH:mm"
          style={{ width: '100%' }}
          disabled={status === false}
          placeholder={status === false ? 'Tidak perlu' : 'Wajib diisi'}
        />
      );
    } else if (inputType === 'keterangan_kehadiran') {
      if (status === true) {
        // Keterangan untuk status 'Hadir' diisi otomatis oleh sistem
        inputNode = <span style={{ color: '#bfbfbf' }}>Otomatis oleh sistem</span>;
      } else {
        const options = [{ value: 'Sakit' }, { value: 'Izin' }, { value: 'Tanpa Keterangan' }];
        inputNode = (
          <Select placeholder="Pilih alasan">
            {options.map(opt => <Option key={opt.value} value={opt.value}>{opt.value}</Option>)}
          </Select>
        );
      }
    }
  }

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={[recordKey, dataIndex]}
          style={{ margin: 0 }}
          rules={[{
            required: (dataIndex === 'status_kehadiran') ||
                      (dataIndex === 'waktu_kehadiran' && status === true) ||
                      (dataIndex === 'keterangan_kehadiran' && status === false),
            message: `Wajib diisi!`,
          }]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

// Komponen Halaman Utama Kehadiran
export default function KehadiranPage() {
  const [list, setList] = useState([]);
  const [form] = Form.useForm();
  const [tanggal, setTanggal] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState('');

  const loadData = useCallback(async (selectedDate) => {
    setLoading(true);
    setEditingKey(''); // Reset mode edit setiap kali data dimuat ulang
    try {
      const res = await axiosAuth.get('/kehadiran', { params: { tanggal: selectedDate.format('YYYY-MM-DD') } });
      setList(res.data.data || []);
    } catch (err) {
      message.error(err.response?.data?.message || 'Gagal memuat data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(tanggal); }, [tanggal, loadData]);

  const isEditing = (record) => record.id_terapis === editingKey;

  const edit = (record) => {
    const recordKey = record.id_terapis;
    const waktuKehadiranObj = record.waktu_kehadiran ? dayjs(record.waktu_kehadiran, 'HH:mm:ss') : null;

    form.setFieldsValue({
      [recordKey]: {
        status_kehadiran: record.status_kehadiran,
        waktu_kehadiran: waktuKehadiranObj,
        keterangan_kehadiran: record.keterangan_kehadiran,
      },
    });
    setEditingKey(recordKey);
  };

  const cancel = () => { setEditingKey(''); };

  const save = async (record) => {
    const recordKey = record.id_terapis;
    try {
      const values = await form.validateFields();
      const formData = values[recordKey];

      const payload = {
        tanggal_kehadiran: tanggal.format('YYYY-MM-DD'),
        id_terapis: record.id_terapis,
        id_sif: record.id_sif,
        status_kehadiran: formData.status_kehadiran,
        waktu_manual: formData.waktu_kehadiran ? formData.waktu_kehadiran.format('HH:mm:ss') : null,
        keterangan_manual: !formData.status_kehadiran ? formData.keterangan_kehadiran : null,
      };

      message.loading({ content: 'Menyimpan...', key: 'save' });
      const res = await axiosAuth.put(`/kehadiran/catat`, payload); // Menangkap respons dari API
      
      setEditingKey('');
      await loadData(tanggal); // Muat ulang data tabel

      // [LOGIKA BARU] Cek apakah ada jadwal alternatif yang dikembalikan oleh backend
      const { alternatif } = res.data;
      if (alternatif && alternatif.length > 0) {
        message.destroy('save'); // Hapus pesan loading

        // [MODAL BARU] Tampilkan modal ringkasan
        Modal.info({
          title: 'Tindakan Lanjutan Diperlukan',
          width: 600,
          content: (
            <div style={{ marginTop: '20px' }}>
              <Text>
                Kehadiran terapis telah dicatat. Karena terapis tidak hadir, jadwal berikut telah dibatalkan secara otomatis dan sistem telah mencoba mencari pengganti.
              </Text>
              <List
                style={{ marginTop: '16px' }}
                header={<Text strong>Ringkasan Jadwal Terdampak</Text>}
                bordered
                dataSource={alternatif}
                renderItem={item => (
                  <List.Item>
                    <div>
                      <Text strong>ID Pesanan Dibatalkan: {item.id_pesanan_dibatalkan}</Text><br/>
                      {item.hasil_pencarian_ulang.solution ? (
                        <Tag icon={<CheckCircleOutlined />} color="success" style={{ marginTop: 4 }}>
                          Solusi pengganti ditemukan: <strong>{item.hasil_pencarian_ulang.solution.nama_terapis}</strong>
                        </Tag>
                      ) : (
                        <Tag icon={<WarningOutlined />} color="warning" style={{ marginTop: 4 }}>
                          Tidak ada solusi otomatis. Perlu penjadwalan ulang manual.
                        </Tag>
                      )}
                    </div>
                  </List.Item>
                )}
              />
              <Text type="secondary" style={{ display: 'block', marginTop: '16px' }}>
                Silakan periksa halaman <strong>Pemesanan / Jadwal Harian</strong> untuk melihat detail dan mengonfirmasi jadwal pengganti.
              </Text>
            </div>
          ),
          okText: 'Mengerti',
          onOk() {
            // [SESSION STORAGE] Simpan data alternatif untuk diakses oleh halaman Pemesanan
            sessionStorage.setItem('pendingReschedules', JSON.stringify(alternatif));
          },
        });
      } else {
        message.success({ content: 'Kehadiran berhasil diperbarui.', key: 'save' });
      }

    } catch (errInfo) {
      if (errInfo.errorFields) message.error("Validasi gagal.");
      else message.error(errInfo.response?.data?.message || 'Gagal menyimpan.');
    }
  };

  const baseColumns = [
    { title: 'No.', render: (_, __, i) => i + 1, width: 50 },
    { title: 'Nama Terapis', dataIndex: 'nama_terapis', sorter: (a, b) => a.nama_terapis.localeCompare(b.nama_terapis), width: 200 },
    { 
      title: 'Sif (Jadwal)', 
      dataIndex: 'nama_sif', 
      width: 140, 
      render: (_, r) => r.nama_sif ? `${r.nama_sif} (${dayjs(r.jam_mulai, 'HH:mm:ss').format('HH:mm')})` : '-' 
    },
    {
      title: 'Waktu Kehadiran',
      dataIndex: 'waktu_kehadiran',
      width: 150,
      editable: true,
      inputType: 'waktu_kehadiran',
      render: (text) => text ? dayjs(text, 'HH:mm:ss').format('HH:mm') : '-',
    },
    {
      title: 'Status Kehadiran',
      dataIndex: 'status_kehadiran',
      width: 150,
      editable: true,
      inputType: 'status',
      render: (status, record) => {
        if (record.tanggal_kehadiran === null) {
          return <Tag color="default">Belum Dicatat</Tag>;
        }
        return (
          <Tag color={status ? 'green' : 'red'}>
            {status ? 'Hadir' : 'Tidak Hadir'}
          </Tag>
        );
      },
    },
    {
      title: 'Keterangan Kehadiran',
      dataIndex: 'keterangan_kehadiran',
      width: 180,
      editable: true,
      inputType: 'keterangan_kehadiran',
      render: (text) => text || '-',
    },
    {
      title: 'Aksi',
      dataIndex: 'aksi',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space size="small">
            <Button onClick={() => save(record)} type="primary" icon={<SaveOutlined />} size="small" title="Simpan" />
            <Button onClick={cancel} type="default" danger icon={<CloseCircleOutlined />} size="small" title="Batal" />
          </Space>
        ) : (
          <Button disabled={editingKey !== ''} onClick={() => edit(record)} icon={<EditOutlined />} size="small" title="Edit" type="primary" ghost />
        );
      },
    },
  ];

  const mergedColumns = baseColumns.map(col => {
    if (!col.editable) return col;
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.inputType,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  return (
    <div style={{ padding: 24, background: '#fff', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>Kehadiran Terapis</h2>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>{tanggal.format('dddd, DD MMMM YYYY')}</p>
        </div>
        <DatePicker value={tanggal} format="DD MMMM YYYY" onChange={(val) => setTanggal(val || dayjs())} allowClear={false} disabled={loading || editingKey !== ''} style={{ width: 200 }} />
      </div>
      {editingKey && (
        <div style={{ marginBottom: 16, padding: '8px 12px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 6, fontSize: '14px' }}>
          <strong>Mode Edit:</strong> Sedang mengedit kehadiran. Selesaikan atau batalkan untuk mengubah tanggal.
        </div>
      )}
      <Form form={form} component={false}>
        <Table
          components={{ body: { cell: EditableCell } }}
          columns={mergedColumns}
          dataSource={list}
          rowKey="id_terapis"
          loading={loading}
          pagination={{ pageSize: 15 }}
          bordered
          scroll={{ x: 1200 }}
          size="middle"
          locale={{ emptyText: 'Tidak ada jadwal kerja untuk tanggal ini' }}
        />
      </Form>
      <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid #f0f0f0', fontSize: '13px', color: '#666' }}>
        <strong>Petunjuk:</strong>
        <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
          <li>Klik tombol <strong>Edit</strong> untuk mengubah status dan detail kehadiran.</li>
          <li>Jika status <strong>Hadir</strong>, Anda wajib mengisi <strong>Waktu Presensi</strong>.</li>
          <li>Jika status <strong>Tidak Hadir</strong>, Anda wajib memilih <strong>Keterangan</strong> (Sakit/Izin/Tanpa Keterangan). Jika jadwal terapis ada, akan dibatalkan otomatis dan sistem mencari pengganti.</li>
        </ul>
      </div>
    </div>
  );
}