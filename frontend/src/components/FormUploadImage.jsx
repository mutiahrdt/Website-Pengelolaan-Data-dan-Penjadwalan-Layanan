// File: components/FormUploadImage.jsx
import { Upload, Modal } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';

export default function FormUploadImage({ value = [], onChange }) {
  const [preview, setPreview] = useState('');

  const getBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const handlePreview = async (file) => {
    let src = file.url;
    if (!src && file.originFileObj) {
      src = await getBase64(file.originFileObj);
    }
    Modal.info({ title: 'Preview Gambar', content: <img src={src} style={{ width: '100%' }} /> });
  };

  const handleChange = ({ fileList }) => {
    onChange?.(fileList);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <Upload
        listType="picture-circle"
        beforeUpload={() => false}
        maxCount={1}
        accept="image/*"
        fileList={value}
        onChange={handleChange}
        onPreview={handlePreview}
      >
        {!value?.length && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PlusCircleOutlined />
            <div style={{ marginTop: 8 }}>Unggah</div>
          </div>
        )}
      </Upload>
    </div>
  );
}
