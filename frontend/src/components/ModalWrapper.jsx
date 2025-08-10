// components/ModalWrapper.jsx
import { Modal, Button } from "antd";

export default function ModalWrapper({
  title,
  open,
  onCancel,
  onOk,
  children,
  width = 600,
  okText = "Simpan",
  cancelText = "Batal",
  loading = false
}) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {cancelText}
        </Button>,
        <Button key="submit" type="primary" onClick={onOk} loading={loading}>
          {okText}
        </Button>
      ]}
      centered
      width={width}
      destroyOnClose
    >
      {children}
    </Modal>
  );
}
