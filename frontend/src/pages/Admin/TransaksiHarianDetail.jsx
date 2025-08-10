import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Button, Row, Col, Typography, message, Spin, Card, Image, Descriptions,
} from 'antd';
import { ArrowLeftOutlined, LeftOutlined, RightOutlined, EditOutlined, PictureOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import InformasiFormModal from '../../components/InformasiFormModal';

const { Title, Text, Paragraph } = Typography;
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

const formatTransaksiData = (items) => {
  if (!items) return {};
  return items.reduce((acc, item) => {
    const key = item.nama_form.replace(/ /g, '_');
    acc[key] = item.nilai_char ?? item.nilai_numerik;
    return acc;
  }, {});
};

export default function TransaksiHarianDetailPage() {
  const { id_pesanan } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [options, setOptions] = useState({ form: [] });
  const [initialFormValues, setInitialFormValues] = useState(null);

  const loadDetail = async (currentId) => {
    setLoading(true);
    try {
      const [resDetail, resOptions] = await Promise.all([
        axiosAuth.get(`/transaksi-harian/detail/${currentId}?v=${Date.now()}`),
        axiosAuth.get('/transaksi-harian/options'),
      ]);

      const responseData = resDetail.data.data;
      if (responseData && responseData.detail) {
        const transaksiSpesifik = formatTransaksiData(responseData.detail.transaksi_items);
        const fotoTerbaru = responseData.foto_terbaru;
        if (!transaksiSpesifik.Foto_Pasien && fotoTerbaru) {
          transaksiSpesifik.Foto_Pasien = fotoTerbaru;
        }
        responseData.detail.transaksi = transaksiSpesifik;
        setData(responseData);
        setOptions(resOptions.data.data || { form: [] });
      } else {
        throw new Error('Data transaksi tidak ditemukan');
      }
    } catch (e) {
      message.error(`Gagal memuat detail: ${e.response?.data?.message || e.message}`);
      navigate('/transaksi-harian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id_pesanan) {
      loadDetail(id_pesanan);
    }
  }, [id_pesanan]);

  const openEditModal = () => {
    const { detail } = data;
    const formattedForms = (detail.transaksi_items || []).map(item => {
        let infoValue;
        if (item.tipe_data === 'upload') {
            const filename = item.nilai_char;
            infoValue = filename ? [{ uid: filename, name: filename, status: 'done', url: `/assets/transaksi-harian/${filename}` }] : [];
        } else {
            infoValue = item.nilai_char ?? item.nilai_numerik;
        }
        return { id_form: item.id_form, informasi: infoValue };
    });

    setInitialFormValues({
        id_pesanan: detail.id_pesanan,
        jadwalLabel: `${detail.nama_pasien} - ${dayjs(detail.tanggal).format('DD MMMM YYYY')} - ${detail.nama_sesi}`,
        forms: formattedForms.length > 0 ? formattedForms : [{}],
    });
    setModalVisible(true);
  };
  
  const handleSubmit = async (values) => {
    setSubmitLoading(true);
    try {
        const { forms } = values;
        if (!forms) {
            setSubmitLoading(false);
            return message.warn('Tidak ada informasi untuk disimpan.');
        }

        message.loading({ content: 'Memperbarui semua informasi...', key: 'submit' });
        
        for (const item of forms) {
            if (!item || !item.id_form) continue;

            const selectedForm = options.form.find(f => f.value === item.id_form);
            const tipeData = selectedForm?.tipeData;
            
            const formData = new FormData();
            formData.append('id_pesanan', id_pesanan);
            formData.append('id_form', item.id_form);
            formData.append('tipe_data', tipeData);

            if (tipeData === 'upload') {
                const fileInfo = item.informasi?.[0];
                if (fileInfo?.originFileObj) {
                    // CASE 1: A NEW file is uploaded.
                    formData.append('informasi_file', fileInfo.originFileObj);
                } else if (fileInfo?.name) {
                    // CASE 2: The OLD file is preserved. Send its name.
                    formData.append('nama_file_lama', fileInfo.name);
                }
            } else {
                // For text/number data
                if (item.informasi !== null && item.informasi !== undefined) {
                    formData.append('informasi', item.informasi);
                }
            }
            
            await axiosAuth.post('/transaksi-harian', formData);
        }

        setModalVisible(false);
        message.success({ content: 'Informasi berhasil diperbarui!', key: 'submit' });
        loadDetail(id_pesanan);

    } catch (e) {
      message.destroy('submit');
      message.error(e.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  if (!data || !data.detail) return <div style={{ textAlign: 'center', padding: '50px' }}><Title level={4}>Data tidak ditemukan.</Title><Button onClick={() => navigate('/transaksi-harian')}>Kembali</Button></div>;

  const { detail, riwayat_pesanan } = data;
  const currentIndex = riwayat_pesanan.findIndex(id => String(id) === String(id_pesanan));
  const prevId = currentIndex > 0 ? riwayat_pesanan[currentIndex - 1] : null;
  const nextId = currentIndex < riwayat_pesanan.length - 1 ? riwayat_pesanan[currentIndex + 1] : null;
  const { transaksi } = detail;
  const totalPembayaran = (Number(transaksi.Harga_Paket) || 0) + (Number(transaksi.Biaya_Tambahan) || 0) + (Number(transaksi.Uang_Tip) || 0);

  return (
    <div style={{ padding: 24, background: '#f0f2f5' }}>
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: '16px' }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/transaksi-harian')}>Kembali</Button>
                <Title level={4} style={{ margin: 0, textAlign: 'center' }}>Detail Transaksi: {detail.nama_pasien}</Title>
                <Button type="primary" icon={<EditOutlined />} onClick={openEditModal}>Edit Informasi</Button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: 24 }}>
                <Button icon={<LeftOutlined />} onClick={() => navigate(`/transaksi-harian/detail/${prevId}`)} disabled={!prevId}>Sebelumnya</Button>
                <Text type="secondary">{`Kunjungan ${currentIndex + 1} dari ${riwayat_pesanan.length}`}</Text>
                <Button icon={<RightOutlined />} onClick={() => navigate(`/transaksi-harian/detail/${nextId}`)} disabled={!nextId}>Selanjutnya</Button>
            </div>
            
            <Row gutter={[32, 24]}>
                <Col xs={24} md={8}>
                    {transaksi.Foto_Pasien ? (
                      <Image
                        width="100%"
                        style={{ maxWidth: '115px', borderRadius: 8, border: '1px solid #f0f0f0', objectFit: 'cover', display: 'block', margin: '0 auto' }}
                        src={`/assets/transaksi-harian/${transaksi.Foto_Pasien}?v=${Date.now()}`}
                        alt={`Foto ${detail.nama_pasien}`}
                        fallback="https://via.placeholder.com/250x200?text=Gagal+Muat"
                      />
                    ) : (
                      <div style={{ width: '250px', height: '200px', backgroundColor: '#fafafa', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', margin: '0 auto', border: '1px dashed #d9d9d9' }}>
                        <PictureOutlined style={{ fontSize: '32px', color: '#8c8c8c' }} />
                        <Text type="secondary" style={{ marginTop: 8 }}>Foto Belum Diunggah</Text>
                      </div>
                    )}
                    <Card type="inner" title="Informasi Pasien & Pembayaran" style={{ marginTop: 24 }}>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Nama Pasien">{detail.nama_pasien}</Descriptions.Item>
                            <Descriptions.Item label="ID Pesanan">{detail.id_pesanan}</Descriptions.Item>
                            <Descriptions.Item label="Harga Paket">Rp {(Number(transaksi.Harga_Paket) || 0).toLocaleString('id-ID')}</Descriptions.Item>
                            <Descriptions.Item label="Biaya Tambahan">Rp {(Number(transaksi.Biaya_Tambahan) || 0).toLocaleString('id-ID')}</Descriptions.Item>
                            <Descriptions.Item label="Uang Tip">Rp {(Number(transaksi.Uang_Tip) || 0).toLocaleString('id-ID')}</Descriptions.Item>
                            <Descriptions.Item label="Total"><Text strong>Rp {totalPembayaran.toLocaleString('id-ID')}</Text></Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
                <Col xs={24} md={16}>
                    <Card type="inner" title="Detail Treatment" style={{ marginBottom: 24 }}>
                        <Descriptions column={2} bordered size="small">
                            <Descriptions.Item label="Waktu">{dayjs(detail.tanggal).format('dddd, DD MMMM YYYY')} - {detail.nama_sesi}</Descriptions.Item>
                            <Descriptions.Item label="Jenis Ruangan">{detail.jenis_ruangan}</Descriptions.Item>
                            <Descriptions.Item label="Paket">{detail.nama_paket || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Terapis">{detail.nama_terapis || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Status" span={2}><Text type="success" strong>{detail.status_jadwal}</Text></Descriptions.Item>
                        </Descriptions>
                    </Card>
                    <Row gutter={16}>
                        <Col span={12}><Card type="inner" title="Sebelum Treatment" style={{ height: '100%' }}><Paragraph><strong>Bagian Cedera:</strong> {transaksi.Bagian_Cedera || '-'}</Paragraph><Paragraph><strong>Kronologi:</strong> {transaksi.Kronologi_Cedera || '-'}</Paragraph><Paragraph><strong>Detail Keluhan:</strong> {transaksi.Detail_Keluhan || '-'}</Paragraph><Paragraph><strong>Lama Keluhan:</strong> {transaksi.Lama_Keluhan ? `${transaksi.Lama_Keluhan} hari` : '-'}</Paragraph><Paragraph><strong>Riwayat Penyakit:</strong> {transaksi.Riwayat_Penyakit || '-'}</Paragraph></Card></Col>
                        <Col span={12}><Card type="inner" title="Sesudah Treatment & Lainnya" style={{ height: '100%' }}><Paragraph><strong>Saran:</strong> {transaksi.Saran_Setelah_Treatment || '-'}</Paragraph><Paragraph><strong>Temuan Lain:</strong> {transaksi.Temuan_Lain || '-'}</Paragraph><Paragraph><strong>Berat Badan:</strong> {transaksi.Berat_Badan ? `${transaksi.Berat_Badan} kg` : '-'}</Paragraph><Paragraph><strong>Trivia:</strong> {transaksi.Trivia || '-'}</Paragraph></Card></Col>
                    </Row>
                </Col>
            </Row>
        </Card>

        {modalVisible && (
            <InformasiFormModal
                open={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleSubmit}
                initialValues={initialFormValues}
                options={options}
                loading={submitLoading}
            />
        )}
    </div>
  );
}