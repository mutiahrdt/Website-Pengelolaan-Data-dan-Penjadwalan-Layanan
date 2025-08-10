// File: components/InformasiFormModal.jsx (FINAL & DIPERBAIKI)

import React, { useEffect } from 'react';
import { Modal, Form, Select, Input, Upload, Button, Space, message } from 'antd';
import { PlusOutlined, UploadOutlined, MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const DynamicInput = ({ tipeData, ...props }) => {
  if (tipeData === 'upload') {
    return (
      <Upload
        {...props}
        name="foto_pasien_dinamis"
        listType="picture-card"
        maxCount={1}
        beforeUpload={() => false} // Mencegah upload otomatis, kita tangani manual
      >
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>Unggah</div>
        </div>
      </Upload>
    );
  }
  if (tipeData === 'number') {
    return <Input type="number" placeholder="Masukkan angka" {...props} />;
  }
  return <TextArea rows={2} placeholder="Masukkan teks atau keterangan" {...props} />;
};

const InformasiFormModal = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  options,
  loading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
        if (initialValues) {
            form.setFieldsValue(initialValues);
        } else {
            form.resetFields();
            form.setFieldsValue({ forms: [{}] });
        }
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (info) {
      console.log('Validate Failed:', info);
      message.error('Gagal validasi. Periksa kembali isian Anda.');
    }
  };

  // PERBAIKAN: Definisikan helper normFile untuk digunakan di getValueFromEvent
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    // Ekstrak fileList dari event object
    return e && e.fileList;
  };

  return (
    <Modal
      open={open}
      title={initialValues?.id_pesanan ? 'Edit Informasi Formulir' : 'Tambah Informasi Formulir'}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" autoComplete="off">
        {initialValues?.id_pesanan ? (
          <Form.Item label="Jadwal Pasien">
            <Input value={initialValues.jadwalLabel} disabled />
          </Form.Item>
        ) : (
          <Form.Item
            name="id_pesanan"
            label="Pilih Jadwal"
            rules={[{ required: true, message: 'Jadwal wajib dipilih!' }]}
          >
            <Select showSearch options={options.jadwal} placeholder="Cari jadwal pasien..." />
          </Form.Item>
        )}

        <Form.List name="forms">
          {(fields, { add, remove }) => (
            <div style={{ maxHeight: '45vh', overflowY: 'auto', padding: '8px' }}>
              {fields.map((field, index) => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8, border: '1px dashed #ccc', padding: '12px', borderRadius: '8px' }} align="start">
                  <Form.Item {...field} name={[field.name, 'id_form']} label="Nama Formulir" rules={[{ required: true }]} style={{ minWidth: 200, flex: 1 }}>
                    <Select options={options.form} placeholder="Pilih tipe informasi" />
                  </Form.Item>

                  <Form.Item noStyle dependencies={[['forms', index, 'id_form']]}>
                    {({ getFieldValue }) => {
                      const idForm = getFieldValue(['forms', index, 'id_form']);
                      const selectedForm = options.form.find(opt => opt.value === idForm);
                      const tipeData = selectedForm?.tipeData;
                      const isUpload = tipeData === 'upload';
                      
                      return (
                        <Form.Item
                          {...field}
                          name={[field.name, 'informasi']}
                          label="Informasi"
                          rules={[{ required: true, message: 'Informasi wajib diisi!' }]}
                          valuePropName={isUpload ? 'fileList' : 'value'}
                          // PERBAIKAN: Kembalikan getValueFromEvent khusus untuk upload
                          getValueFromEvent={isUpload ? normFile : undefined}
                          style={{ flex: 2 }}
                        >
                          <DynamicInput tipeData={tipeData} />
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} style={{ color: 'red', marginTop: '35px' }}/>
                </Space>
              ))}
              <Form.Item style={{ marginTop: '16px' }}>
                <Button type="dashed" onClick={() => add({})} block icon={<PlusCircleOutlined />}>Tambah Formulir Lain</Button>
              </Form.Item>
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default InformasiFormModal;