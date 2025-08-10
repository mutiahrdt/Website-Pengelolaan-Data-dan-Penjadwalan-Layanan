// components/TableActionButtons.jsx
import { Button, Space } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";

export default function TableActionButtons({ onEdit, onAdd, addText = "Tambah" }) {
  return (
    <Space>
      {onAdd && (
        <Button icon={<PlusOutlined />} onClick={onAdd}>
          {addText}
        </Button>
      )}
      {onEdit && (
        <Button icon={<EditOutlined />} onClick={onEdit} />
      )}
    </Space>
  );
}
