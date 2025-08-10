// components/ExpandedRowTable.jsx
import { Table } from "antd";

export default function ExpandedRowTable({ data = [], columns = [], rowKey = "id", numbered = true }) {
  const dataWithNo = numbered
    ? data.map((item, i) => ({ ...item, no: i + 1 }))
    : data;

  const finalColumns = numbered
    ? [{ title: "No.", dataIndex: "no", width: 60 }, ...columns]
    : columns;

  return (
    <Table
      dataSource={dataWithNo}
      columns={finalColumns}
      pagination={false}
      rowKey={rowKey}
      scroll={{ x: "max-content" }}
      bordered
    />
  );
}
