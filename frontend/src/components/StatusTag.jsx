import { Tag } from 'antd';

export default function StatusTag({ value }) {
  return (
    <Tag
      color={value ? "green" : "red"}
      style={{
        minWidth: 70,
        textAlign: "center",
        display: "inline-block",
        padding: '0 8px'
      }}
    >
      {value ? "Aktif" : "Tidak Aktif"}
    </Tag>
  );
}
