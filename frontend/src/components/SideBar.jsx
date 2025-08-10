import React from 'react';
import { Layout, Menu, Drawer } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import LogoutButton from './LogoutButton';

const { Sider } = Layout;

/**
 * @param {{
 *  menuItems: Array,
 *  collapsed: boolean,
 *  onCollapse: (val: boolean) => void,
 *  isMobile: boolean
 * }} props
 */
export default function SideBar({ menuItems, collapsed, onCollapse, isMobile }) {
  const location = useLocation();
  const path = location.pathname;
  const selectedKey = menuItems.find(item => path.startsWith(item.path))?.key || menuItems[0]?.key;

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: 16, gap: 12 }}>
        <img src={logo} alt="MR MASSAGE" style={{ height: 32 }} />
        <span style={{ fontSize: 18, fontWeight: 600 }}>MR MASSAGE</span>
      </div>

      <Menu mode="inline" selectedKeys={[selectedKey]} style={{ borderRight: 0 }}>
        {menuItems.map(item => (
          <Menu.Item key={item.key} icon={item.icon}>
            <Link to={item.path}>{item.label}</Link>
          </Menu.Item>
        ))}
      </Menu>

      <div style={{ flex: 1 }} />
      <LogoutButton />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        closable={false}
        onClose={() => onCollapse(true)}
        open={!collapsed}
        width={240}
        bodyStyle={{ padding: 0 }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Sider
      width={200}
      collapsedWidth={0}
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      trigger={null}
      style={{
        background: '#fff',
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1050,
      }}
    >
      {sidebarContent}
    </Sider>
  );
}
