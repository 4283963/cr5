import React, { useState } from 'react'
import { Layout, Menu, theme } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  DashboardOutlined,
  AppstoreOutlined,
  ShopOutlined,
  TagsOutlined,
  FileTextOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '数据概览',
  },
  {
    key: '/machines',
    icon: <AppstoreOutlined />,
    label: '机器管理',
  },
  {
    key: '/channels',
    icon: <ShopOutlined />,
    label: '货道管理',
  },
  {
    key: '/tags',
    icon: <TagsOutlined />,
    label: '标签管理',
  },
  {
    key: '/orders',
    icon: <FileTextOutlined />,
    label: '订单管理',
  },
]

function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            background: 'rgba(255, 255, 255, 0.1)',
            margin: 16,
            borderRadius: 8,
          }}
        >
          {collapsed ? '分拣' : '图书盲盒分拣'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
          }}
        >
          <h2 style={{ margin: 0 }}>图书盲盒分拣中控系统</h2>
          <div style={{ color: '#666' }}>管理员</div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
