import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/id';
import {
    Table, DatePicker, Spin, Alert, Card, Typography, Tag, Tooltip, Empty, Space, Button, Modal, message,
    Form, Select, Radio, InputNumber, Row, Col, Input, List, Divider, Descriptions
} from 'antd';
import { 
    ScheduleOutlined, LoadingOutlined, PlusOutlined, WarningOutlined, HomeOutlined,
    CheckCircleOutlined, CloseCircleOutlined, UserOutlined, CalendarOutlined, SolutionOutlined, InfoCircleOutlined, IssuesCloseOutlined
} from '@ant-design/icons';

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);
dayjs.locale('id');
const { Title, Text } = Typography;
const { Option } = Select;

// Konfigurasi Axios
const axiosAuth = axios.create({ baseURL: '/api' });
axiosAuth.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error));


// Komponen Form Pemesanan
const FormPemesanan = ({ visible, onCancel, initialValues, onSubmitSuccess, allSesi = [] }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [pasienList, setPasienList] = useState([]);
    const [paketList, setPaketList] = useState([]);
    const [terapisList, setTerapisList] = useState([]);
    const [jenisRuangan, setJenisRuangan] = useState('Onsite');
    const [jenisPreferensi, setJenisPreferensi] = useState('tidak_ada');

    const isEditing = useMemo(() => !!initialValues?.id_pesanan, [initialValues]);

    const fetchDataForForm = useCallback(async () => {
        setLoading(true);
        try {
            const [resPasien, resPaket, resTerapis] = await Promise.all([
                axiosAuth.get('/pasien'),
                axiosAuth.get('/harga-paket'),
                axiosAuth.get('/terapis?status=true'),
            ]);
            setPasienList(resPasien.data.data || []);
            setPaketList(resPaket.data.data || []);
            setTerapisList(resTerapis.data.data || []);
        } catch (error) {
            message.error('Gagal memuat data untuk form.');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (visible) {
            fetchDataForForm();
            form.resetFields();
            if (!initialValues) {
                form.setFieldsValue({
                    tanggal: dayjs(),
                    jenis_ruangan: 'Onsite',
                    jenis_preferensi: 'tidak_ada',
                });
                setJenisRuangan('Onsite');
                setJenisPreferensi('tidak_ada');
            } else {
                const initialRoomType = initialValues.jenis_ruangan || (!initialValues.namaRuangan?.toLowerCase().includes('homecare') ? 'Onsite' : 'Homecare');
                const initialPrefType = (initialValues.preferensi_nama_terapis) ? 'nama' : (initialValues.preferensi_gender_terapis ? 'gender' : 'tidak_ada');
                
                form.setFieldsValue({
                    tanggal: dayjs(initialValues.tanggal || initialValues.waktu_pijat),
                    sesi_mulai: initialValues.id_sesi_mulai,
                    id_pasien: initialValues.id_pasien,
                    id_paket: initialValues.id_paket,
                    jenis_ruangan: initialRoomType,
                    waktu_perjalanan: initialValues.waktu_tempuh,
                    jenis_preferensi: initialPrefType,
                    preferensi_nama_terapis: initialValues.nama_terapis || initialValues.preferensi_nama_terapis,
                    preferensi_jenis_kelamin: initialValues.preferensi_gender_terapis,
                });
                setJenisRuangan(initialRoomType);
                setJenisPreferensi(initialPrefType);
            }
        }
    }, [visible, initialValues, form, fetchDataForForm]);

    const handleFinish = async (values) => {
        setLoading(true);
        const payload = {
            id_pasien: isEditing ? initialValues.id_pasien : values.id_pasien,
            id_paket: values.id_paket,
            tanggal: values.tanggal.format('YYYY-MM-DD'),
            sesi_mulai: values.sesi_mulai,
            jenis_ruangan: values.jenis_ruangan,
            waktu_tempuh: values.jenis_ruangan === 'Homecare' ? values.waktu_perjalanan : null,
            preferensi: {
                nama_terapis: values.jenis_preferensi === 'nama' ? values.preferensi_nama_terapis : null,
                jenis_kelamin: values.jenis_preferensi === 'gender' ? values.preferensi_jenis_kelamin : null,
            }
        };

        try {
            const url = isEditing ? `/penjadwalan/update/${initialValues.id_pesanan}` : '/penjadwalan/create';
            const response = await axiosAuth.post(url, payload);
            const resData = response.data;
            if (resData.success) {
                if (resData.status === 'SAVED') {
                    onSubmitSuccess(true, resData.message || 'Jadwal berhasil diproses!');
                } else if (resData.status === 'CONFIRMATION_REQUIRED') {
                    onSubmitSuccess(false, { 
                        solution: resData.solution, 
                        originalInput: resData.originalInput 
                    });
                }
            } else {
                 Modal.error({
                    title: 'Jadwal Gagal Dibuat',
                    content: resData.message || 'Tidak dapat membuat jadwal karena melanggar batasan wajib sistem.',
                    okText: 'Tutup'
                });
                 onSubmitSuccess(true, null);
            }
        } catch (error) {
            const resData = error.response?.data;
            Modal.error({
                title: 'Jadwal Gagal Dibuat',
                content: resData?.message || 'Terjadi kesalahan pada server.',
            });
            onSubmitSuccess(true, null);
        } finally {
            setLoading(false);
        }
    };

    const modalTitle = isEditing ? "Reschedule Jadwal" : "Tambah Pesanan Baru";

    return (
        <Modal title={modalTitle} open={visible} onCancel={onCancel} footer={null} centered width={600} destroyOnClose>
            <Spin spinning={loading}>
                <Form form={form} layout="vertical" onFinish={handleFinish}>
                    <Form.Item name="id_pasien" label="Pasien" rules={[{ required: true }]} >
                        <Select showSearch placeholder="Pilih pasien" disabled={isEditing} filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
                            {pasienList.map(p => <Option key={p.id_pasien} value={p.id_pasien}>{`${p.nama_pasien} (${p.no_hp_pasien})`}</Option>)}
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="tanggal" label="Tanggal" rules={[{ required: true }]}><DatePicker format="DD-MM-YYYY" style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="sesi_mulai" label="Sesi Mulai" rules={[{ required: true }]}><Select placeholder="Pilih sesi">{allSesi.map(s => <Option key={s.id_sesi} value={s.id_sesi}>{`${s.nama_sesi} (${dayjs(s.jam_mulai, 'HH:mm:ss').format('HH:mm')})`}</Option>)}</Select></Form.Item></Col>
                    </Row>
                    <Form.Item name="id_paket" label="Paket Layanan" rules={[{ required: true }]}><Select placeholder="Pilih paket layanan">{paketList.map(p => <Option key={p.id_paket} value={p.id_paket}>{p.nama_paket}</Option>)}</Select></Form.Item>
                    <Form.Item name="jenis_ruangan" label="Jenis Ruangan" rules={[{ required: true }]}><Radio.Group onChange={(e) => setJenisRuangan(e.target.value)}><Radio.Button value="Onsite">Onsite</Radio.Button><Radio.Button value="Homecare">Homecare</Radio.Button></Radio.Group></Form.Item>
                    {jenisRuangan === 'Homecare' && <Form.Item name="waktu_perjalanan" label="Waktu Perjalanan (menit, sekali jalan)"><InputNumber min={0} style={{ width: '100%' }} addonAfter="menit" /></Form.Item>}
                    <Form.Item label="Preferensi Terapis (Opsional)">
                        <Input.Group compact>
                            <Form.Item name="jenis_preferensi" noStyle>
                                <Select style={{ width: '40%' }} onChange={setJenisPreferensi}>
                                    <Option value="tidak_ada">Tidak Ada</Option>
                                    <Option value="nama">Nama Terapis</Option>
                                    <Option value="gender">Jenis Kelamin</Option>
                                </Select>
                            </Form.Item>
                            {jenisPreferensi === 'nama' && ( <Form.Item name="preferensi_nama_terapis" noStyle> <Select showSearch placeholder="Pilih Terapis" style={{ width: '60%' }} filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}> {terapisList.map(t => <Option key={t.id_terapis} value={t.nama_terapis}>{t.nama_terapis}</Option>)} </Select> </Form.Item> )}
                            {jenisPreferensi === 'gender' && ( <Form.Item name="preferensi_jenis_kelamin" noStyle> <Select placeholder="Pilih Jenis Kelamin" style={{ width: '60%' }}> <Option value="L">Laki-laki</Option> <Option value="P">Perempuan</Option> </Select> </Form.Item> )}
                        </Input.Group>
                    </Form.Item>
                    <Row justify="end" style={{ marginTop: 24 }}><Space><Button onClick={onCancel}>Batal</Button><Button type="primary" htmlType="submit" loading={loading}>{isEditing ? "Cari Jadwal Ulang" : "Cari Jadwal"}</Button></Space></Row>
                </Form>
            </Spin>
        </Modal>
    );
};

// Main Page Component
export default function PemesananPage() {
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availabilityData, setAvailabilityData] = useState(null);
    const [allSesi, setAllSesi] = useState([]);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [isFormModalVisible, setIsFormModalVisible] = useState(false);
    const [modalInitialValues, setModalInitialValues] = useState(null);
    const [pendingConfirmation, setPendingConfirmation] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const fetchData = useCallback(async (date) => {
        setLoading(true);
        setError(null);
        try {
            const formattedDate = date.format('YYYY-MM-DD');
            const [resAvailability, resSesi, resUpcoming] = await Promise.all([
                axiosAuth.get(`/penjadwalan/availability?tanggal=${formattedDate}`),
                axiosAuth.get('/sesi'),
                axiosAuth.get('/penjadwalan/upcoming'),
            ]);
            setAvailabilityData(resAvailability.data.data);
            setAllSesi(resSesi.data.data || []);
            setUpcomingBookings(resUpcoming.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan server.');
        } finally { 
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (localStorage.getItem('token')) { 
            fetchData(selectedDate);
        }
    }, [selectedDate, fetchData]); // [PERBAIKAN] `fetchData` ada di dependency array

    const handleFormSubmit = (isSaved, data) => {
        setIsFormModalVisible(false);
        if (isSaved) {
            if (data) message.success(data);
            fetchData(selectedDate);
            setPendingConfirmation(null);
        } else if (data && data.solution) {
            setPendingConfirmation(data);
            message.warning('Ditemukan jadwal alternatif. Mohon konfirmasi.');
        }
    };

    const handleConfirmSchedule = async () => {
        if (!pendingConfirmation?.solution) return;
        setConfirmLoading(true);
        try {
            const payload = {
              input: pendingConfirmation.originalInput,
              solution: pendingConfirmation.solution,
            };
            const response = await axiosAuth.post('/penjadwalan/confirm', payload);
            if (response.data.success) {
                message.success('Jadwal alternatif berhasil diterima dan disimpan!');
                setPendingConfirmation(null);
                fetchData(selectedDate);
            } else {
                message.error(response.data.message || "Gagal mengonfirmasi jadwal.");
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal menyimpan jadwal yang dikonfirmasi.');
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleDeclineSchedule = () => {
        setPendingConfirmation(null);
        message.info('Jadwal alternatif ditolak.');
    };

    const openFormModal = (initialData = null) => {
        setModalInitialValues(initialData);
        setIsFormModalVisible(true);
    };

    const handleSlotClick = useCallback((terapis, sesi) => {
        openFormModal({
            preferensi_nama_terapis: terapis.nama_terapis,
            tanggal: selectedDate,
            id_sesi_mulai: sesi.key,
        });
    }, [selectedDate]);

    const handleEditClick = useCallback((booking) => {
        openFormModal({ ...booking });
    }, []);

    const handleCancelBooking = useCallback((booking) => {
        let cancellationReason = null;
        Modal.confirm({
            title: `Batalkan jadwal untuk ${booking.nama_pasien}?`,
            icon: <IssuesCloseOutlined style={{ color: '#ff4d4f' }} />,
            content: (
                <div style={{ marginTop: '16px' }}>
                    <Text strong>Dibatalkan Oleh: <span style={{color: 'red'}}>*</span></Text>
                    <Radio.Group style={{ display: 'block', marginTop: '8px' }} onChange={(e) => { cancellationReason = e.target.value; }}>
                        <Radio value="Dibatalkan Pasien">Pasien</Radio>
                        <Radio value="Dibatalkan MR">MR (Internal)</Radio>
                    </Radio.Group>
                </div>
            ),
            okText: 'Ya, Batalkan',
            cancelText: 'Tidak',
            okButtonProps: { danger: true },
            onOk: async () => {
                if (!cancellationReason) {
                    message.error("Anda harus memilih alasan pembatalan.");
                    return Promise.reject("Alasan pembatalan tidak dipilih.");
                }
                try {
                    await axiosAuth.delete(`/penjadwalan/cancel/${booking.id_pesanan}`, { data: { status_jadwal: cancellationReason } });
                    message.success('Jadwal berhasil dibatalkan.');
                    fetchData(selectedDate);
                } catch (err) {
                    message.error(err.response?.data?.message || "Gagal membatalkan jadwal.");
                    return Promise.reject(err);
                }
            }
        });
    }, [fetchData, selectedDate]);

    const { columns, dataSource } = useMemo(() => {
        if (!availabilityData || allSesi.length === 0) return { columns: [], dataSource: [] };
        const { ruangan = [], bookings = [], terapis: allAvailableTerapis = [] } = availabilityData;

        const bookingsMap = new Map();
        (bookings || []).forEach(booking => {
            const key = `${booking.id_sesi_mulai}-${booking.id_ruangan}`;
            bookingsMap.set(key, booking);
        });

        const sesiDataSource = allSesi.sort((a, b) => a.id_sesi.localeCompare(b.id_sesi)).map(sesi => ({
            key: sesi.id_sesi,
            sesi: sesi.nama_sesi,
            waktu: `${dayjs(sesi.jam_mulai, 'HH:mm:ss').format('HH:mm')} - ${dayjs(sesi.jam_selesai, 'HH:mm:ss').format('HH:mm')}`,
            jam_mulai_obj: dayjs(sesi.jam_mulai, 'HH:mm:ss'),
            jam_selesai_obj: dayjs(sesi.jam_selesai, 'HH:mm:ss'),
        }));

        const roomColumns = (ruangan || [])
            .sort((a, b) => {
                const isAHomecare = a.nama.toLowerCase().includes('homecare');
                const isBHomecare = b.nama.toLowerCase().includes('homecare');
                if (isAHomecare === isBHomecare) return a.nama.localeCompare(b.nama);
                return isAHomecare ? 1 : -1;
            })
            .map(room => ({
                title: room.nama, dataIndex: room.id, key: room.id, width: 150, align: 'center',
                render: (_, sesiRecord) => {
                    const cellKey = `${sesiRecord.key}-${room.id}`;
                    const bookingInSlot = bookingsMap.get(cellKey);
                    const now = dayjs();
                    const slotEndTime = selectedDate.hour(sesiRecord.jam_selesai_obj.hour()).minute(sesiRecord.jam_selesai_obj.minute());

                    if (bookingInSlot) {
                        const isCompleted = now.isAfter(slotEndTime);
                        const currentStatus = bookingInSlot.status_jadwal || 'Aktif';
                        const finalStatus = isCompleted ? 'Terlaksana' : currentStatus;

                        if (finalStatus.startsWith('Dibatalkan')) {
                            return (
                                <Tooltip title={`Dibatalkan. Klik untuk menjadwalkan ulang.`}>
                                    <Tag onClick={() => handleEditClick(bookingInSlot)} color="default" style={{ width: '100%', padding: '8px 4px', borderStyle: 'dashed', cursor: 'pointer', textAlign: 'center', background: '#fafafa' }}>
                                        <Text delete>{bookingInSlot.nama_pasien}</Text><br/>
                                        <Text type="secondary" style={{fontSize: 11}}>[{bookingInSlot.inisial_terapis}]</Text>
                                    </Tag>
                                </Tooltip>
                            );
                        }

                        const isBooked = finalStatus === 'Aktif';
                        // [PERBAIKAN] Logika warna dan style yang benar
                        const tagProps = {
                            color: isBooked ? 'processing' : 'default',
                            style: {
                                width: '100%',
                                padding: '8px 4px',
                                cursor: isBooked ? 'pointer' : 'default',
                                textAlign: 'center',
                                ...( !isBooked && { // Style tambahan jika sudah terlaksana
                                    background: '#f5f5f5',
                                    borderColor: '#d9d9d9',
                                    color: 'rgba(0, 0, 0, 0.45)'
                                })
                            },
                            onClick: isBooked ? () => handleEditClick(bookingInSlot) : null
                        };

                        const title = isBooked ? `Jadwal Aktif. Klik untuk reschedule/batal.` : `Jadwal telah terlaksana.`;

                        return (
                            <div style={{ position: 'relative' }}>
                                <Tooltip title={title}>
                                    <Tag {...tagProps}>
                                        <Text strong style={{color: isBooked ? 'inherit' : 'rgba(0, 0, 0, 0.65)'}}>{bookingInSlot.nama_pasien}</Text><br/>
                                        <Text type="secondary" style={{fontSize: 11}}>[{bookingInSlot.inisial_terapis}]</Text>
                                    </Tag>
                                </Tooltip>
                                {isBooked && (
                                    <Button type="text" danger size="small" icon={<CloseCircleOutlined />} onClick={() => handleCancelBooking(bookingInSlot)} style={{ position: 'absolute', top: -5, right: -5, zIndex: 1, background: 'white', borderRadius: '50%' }}/>
                                )}
                            </div>
                        );
                    }
                    
                    const terapisBookedInThisSession = Array.from(bookingsMap.values()).filter(b => b.id_sesi_mulai === sesiRecord.key).map(b => b.id_terapis);
                    
                    const uniqueAvailableTerapis = (allAvailableTerapis || [])
                        .filter(t => {
                            // 1. Filter terapis yang sudah punya jadwal di sesi ini
                            if (terapisBookedInThisSession.includes(t.id_terapis)) {
                                return false;
                            }

                            // 2. Filter terapis yang tidak bekerja pada jam sif ini
                            const sesiMulai = sesiRecord.jam_mulai_obj;
                            const sifMulai = dayjs(t.sif_mulai, 'HH:mm:ss');
                            const sifSelesai = dayjs(t.sif_selesai, 'HH:mm:ss');
                            if (!sifMulai.isValid() || !sifSelesai.isValid() || !sesiMulai.isBetween(sifMulai, sifSelesai, 'second', '[)')) {
                                return false;
                            }

                            // 3. [LOGIKA KRITIS] Filter terapis yang terlambat
                            if (t.waktu_kehadiran_aktual) {
                                const waktuHadir = dayjs(t.waktu_kehadiran_aktual, 'HH:mm:ss');
                                // Jika sesi dimulai SEBELUM terapis hadir, maka dia tidak tersedia untuk sesi ini.
                                if (sesiMulai.isBefore(waktuHadir)) {
                                    return false;
                                }
                            }
                            
                            // Jika lolos semua filter, maka terapis tersedia
                            return true;
                        });

                    if (uniqueAvailableTerapis.length > 0) {
                        return (
                            <Space direction="vertical" style={{ width: '100%' }} size={2}>
                                {uniqueAvailableTerapis.map(t => (
                                    <Tag color="green" key={t.id_terapis} onClick={() => handleSlotClick(t, sesiRecord)} style={{ cursor: 'pointer', width: '100%', textAlign: 'center' }}>
                                        [{t.inisial_terapis}] Tersedia
                                    </Tag>
                                ))}
                            </Space>
                        );
                    }
                    return <Tag style={{ width: '100%', padding: '8px 4px', borderStyle: 'dashed', background: 'transparent', color: '#bfbfbf' }}>N/A</Tag>;
                }
            }));

        return { columns: [{ title: 'Sesi', dataIndex: 'sesi', key: 'sesi', width: 100, fixed: 'left', render: (text, record) => <div style={{textAlign: 'center'}}><Text strong>{text}</Text><br /><Text type="secondary" style={{fontSize: '12px'}}>{record.waktu}</Text></div> }, ...roomColumns], dataSource: sesiDataSource };
    }, [availabilityData, allSesi, selectedDate, handleCancelBooking, handleEditClick, handleSlotClick]);

    if (!localStorage.getItem('token')) {
        return <Alert message="Akses Ditolak" description="Anda harus login untuk mengakses halaman ini." type="error" showIcon />;
    }

    return (
        <>
            <Row gutter={24}>
                <Col xs={24} lg={17} xl={18}>
                    <Card title={<Space><ScheduleOutlined /><Title level={4} style={{ margin: 0 }}>Jadwal Harian</Title></Space>} bordered={false}>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <Space>
                                <Text strong>{selectedDate.format('dddd').toUpperCase()}</Text>
                                <DatePicker 
                                    value={selectedDate} 
                                    onChange={(date) => setSelectedDate(date || dayjs())} 
                                    format="DD-MM-YYYY" 
                                    allowClear={false} 
                                    disabled={loading} 
                                />
                                {loading && <Spin />}
                            </Space>
                            {error && <Alert message="Error" description={error} type="error" showIcon />}
                            <Table columns={columns} dataSource={dataSource} bordered size="small" scroll={{ x: 'max-content' }} pagination={false} loading={loading} />
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={7} xl={6}>
                     <Card title="Jadwal & Konfirmasi" bordered={false}>
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <Button type="primary" icon={<PlusOutlined />} block onClick={() => openFormModal()}>
                                Tambah Pesanan
                            </Button>

                            {pendingConfirmation && (
                                <Card title={<><InfoCircleOutlined style={{color: '#faad14'}} /> Konfirmasi Jadwal</>} size="small" style={{ borderColor: '#faad14' }}>
                                    <Descriptions column={1} size="small" bordered style={{marginBottom: 12}}>
                                        <Descriptions.Item label="Terapis">{pendingConfirmation.solution.nama_terapis}</Descriptions.Item>
                                        <Descriptions.Item label="Ruangan">{pendingConfirmation.solution.nama_ruangan}</Descriptions.Item>
                                    </Descriptions>
                                    {pendingConfirmation.solution.recommendations?.length > 0 && (
                                        <Alert 
                                            message="Pelanggaran Preferensi"
                                            description={pendingConfirmation.solution.recommendations[0]?.message}
                                            type="warning"
                                            showIcon
                                            style={{marginBottom: 12}}
                                        />
                                    )}
                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Button danger onClick={handleDeclineSchedule} loading={confirmLoading}>Tolak</Button>
                                        <Button type="primary" onClick={handleConfirmSchedule} loading={confirmLoading}>Terima & Simpan</Button>
                                    </Space>
                                </Card>
                            )}
                            
                            <Divider style={{ margin: '5px 0' }}>Jadwal Aktif</Divider>

                            <Spin spinning={loading}>
                                {upcomingBookings.length > 0 ? (
                                    <List
                                        dataSource={upcomingBookings}
                                        renderItem={item => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    title={item.nama_pasien}
                                                    description={
                                                        <>
                                                            <Text type="secondary" style={{ display: 'block' }}> <CalendarOutlined /> {dayjs(item.waktu_pijat).format('DD MMM YY')} {dayjs(item.jam_mulai, 'HH:mm:ss').format('HH:mm')} </Text>
                                                            
                                                            {/* [PENAMBAHAN] Menampilkan nama paket */}
                                                            <Text type="secondary" style={{ display: 'block' }}> <SolutionOutlined /> {item.nama_paket} </Text>
                                                            
                                                            <Text type="secondary" style={{ display: 'block' }}> <UserOutlined/> {item.nama_terapis} </Text>
                                                        </>
                                                    }
                                                />
                                                {/* [PENAMBAHAN] Menampilkan jenis ruangan sebagai Tag */}
                                                <Tag color={item.jenis_ruangan === 'Homecare' ? 'orange' : 'blue'}>{item.jenis_ruangan}</Tag>
                                            </List.Item>
                                        )}
                                    />
                                ) : (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Belum ada jadwal aktif" />
                                )}
                            </Spin>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {isFormModalVisible && (
                <FormPemesanan
                    visible={isFormModalVisible}
                    onCancel={() => setIsFormModalVisible(false)}
                    initialValues={modalInitialValues}
                    onSubmitSuccess={handleFormSubmit}
                    allSesi={allSesi}
                />
            )}
        </>
    );
}