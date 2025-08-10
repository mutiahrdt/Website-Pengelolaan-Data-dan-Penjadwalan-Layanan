import React, { useEffect, useState } from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SideBar from './SideBar';
import {
  UserOutlined,
  SolutionOutlined,
  FieldTimeOutlined,
  HeartOutlined,
  EnvironmentOutlined,
  TableOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined,
  MenuOutlined,
} from '@ant-design/icons';

const { Header, Content } = Layout;

const menuMap = {
  Superadmin: [
    { key: 'cabang-ruangan', label: 'Cabang & Ruangan', icon: <EnvironmentOutlined />, path: '/cabang-ruangan' },
    { key: 'akun-admin', label: 'Administratif', icon: <UserOutlined />, path: '/akun-admin' },
    { key: 'terapis', label: 'Terapis', icon: <SolutionOutlined />, path: '/terapis' },
    { key: 'paket', label: 'Keahlian & Paket', icon: <HeartOutlined />, path: '/paket' },
    { key: 'sif-sesi', label: 'Sesi & Sif', icon: <FieldTimeOutlined />, path: '/sif-sesi' },
  ],
  Admin: [
    { key: 'harga-paket', label: 'Harga Paket', icon: <HeartOutlined />, path: '/harga-paket' },
    { key: 'jam-kerja', label: 'Jam Kerja Terapis', icon: <ClockCircleOutlined />, path: '/jam-kerja' },
    { key: 'presensi', label: 'Kehadiran', icon: <UserOutlined />, path: '/presensi' },
    { key: 'pasien', label: 'Pasien', icon: <TeamOutlined />, path: '/pasien' },
    { key: 'pemesanan', label: 'Pemesanan', icon: <CalendarOutlined />, path: '/pemesanan' },
    { key: 'transaksi', label: 'Transaksi Harian', icon: <FileTextOutlined />, path: '/transaksi-harian' },
  ]
};

export default function MainLayout() {
  const { role, inisial_admin, foto_admin } = useAuth();
  const menu = menuMap[role] || [];

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile && collapsed) {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [collapsed]);

  return (
    <Layout>
      <SideBar
        menuItems={menu}
        collapsed={collapsed}
        onCollapse={val => setCollapsed(val)}
        isMobile={isMobile}
      />

      <Layout
        style={{
          marginLeft: !isMobile ? 200 : 0,
          transition: 'margin-left 0.2s ease',
          minHeight: '100vh'
        }}
      >
        <Header
          style={{
            background: '#fff',
            padding: '12px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1000,
            width: '100%',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && collapsed && (
              <MenuOutlined
                style={{ fontSize: 20 }}
                onClick={() => setCollapsed(false)}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
            <Menu mode="horizontal" selectable={false} style={{ borderBottom: 'none' }}>
            <Menu.Item key="home">
              <Link to="/home">Home</Link>
            </Menu.Item>
              <Menu.Item key="jadwal">Jadwal</Menu.Item>
            </Menu>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {foto_admin ? (
                <img
                  src={`${foto_admin}`}
                  alt={inisial_admin}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginBottom: 2
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    backgroundColor: "#1890ff",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 2
                  }}
                >
                  {inisial_admin || role?.[0]}
                </div>
              )}
              <span style={{ fontWeight: 500, fontSize: 12, lineHeight: 1 }}>
                {inisial_admin || role}
              </span>
            </div>
          </div>
        </Header>

        <Content style={{ marginLeft: 10, marginTop: 75, marginRight: 10, padding: 20, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
