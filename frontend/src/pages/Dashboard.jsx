import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Space } from 'antd'
import {
  AppstoreOutlined,
  ShopOutlined,
  TagsOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { machineApi, tagApi, orderApi, channelApi } from '../services/api'

function Dashboard() {
  const [stats, setStats] = useState({
    machines: 0,
    channels: 0,
    tags: 0,
    orders: 0,
  })
  const [orderStats, setOrderStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [machines, setMachines] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [machinesData, tagsData, ordersData, orderStatsData] = await Promise.all([
        machineApi.list(),
        tagApi.list(),
        orderApi.list({ limit: 10 }),
        orderApi.statistics(),
      ])
      setMachines(machinesData)
      setStats({
        machines: machinesData.length,
        tags: tagsData.length,
        orders: orderStatsData.total || 0,
        channels: machinesData.reduce((sum, m) => sum + (m.total_channels || 0), 0),
      })
      setOrderStats(orderStatsData)
      setRecentOrders(ordersData)
    } catch (error) {
      console.error('加载数据失败', error)
    }
  }

  const statusColors = {
    pending: 'orange',
    dispensing: 'blue',
    completed: 'green',
    failed: 'red',
    cancelled: 'default',
    partial: 'gold',
  }

  const statusLabels = {
    pending: '待处理',
    dispensing: '出货中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
    partial: '部分完成',
  }

  const machineStatusColors = {
    online: 'green',
    offline: 'default',
  }

  const machineStatusLabels = {
    online: '在线',
    offline: '离线',
  }

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
    },
    {
      title: '数量',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>数据概览</h2>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="机器数量"
              value={stats.machines}
              prefix={<AppstoreOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="货道总数"
              value={stats.channels}
              prefix={<ShopOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="标签数量"
              value={stats.tags}
              prefix={<TagsOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={stats.orders}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {orderStats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={8} md={4}>
            <Card size="small" className="stat-card">
              <div className="stat-value" style={{ color: '#faad14' }}>
                {orderStats.pending}
              </div>
              <div className="stat-label">
                <Space>
                  <ClockCircleOutlined />
                  待处理
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={8} md={4}>
            <Card size="small" className="stat-card">
              <div className="stat-value" style={{ color: '#1890ff' }}>
                {orderStats.dispensing}
              </div>
              <div className="stat-label">
                <Space>
                  <ClockCircleOutlined />
                  出货中
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={8} md={4}>
            <Card size="small" className="stat-card">
              <div className="stat-value" style={{ color: '#52c41a' }}>
                {orderStats.completed}
              </div>
              <div className="stat-label">
                <Space>
                  <CheckCircleOutlined />
                  已完成
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={8} md={4}>
            <Card size="small" className="stat-card">
              <div className="stat-value" style={{ color: '#ff4d4f' }}>
                {orderStats.failed}
              </div>
              <div className="stat-label">
                <Space>
                  <ExclamationCircleOutlined />
                  失败
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={8} md={4}>
            <Card size="small" className="stat-card">
              <div className="stat-value" style={{ color: '#8c8c8c' }}>
                {orderStats.cancelled}
              </div>
              <div className="stat-label">已取消</div>
            </Card>
          </Col>
          <Col xs={8} md={4}>
            <Card size="small" className="stat-card">
              <div className="stat-value" style={{ color: '#fa8c16' }}>
                {orderStats.partial}
              </div>
              <div className="stat-label">部分完成</div>
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col lg={12}>
          <Card title="机器状态" size="small">
            {machines.map((machine) => (
              <div
                key={machine.id}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{machine.name}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>
                    {machine.code} | {machine.location}
                  </div>
                </div>
                <Tag color={machineStatusColors[machine.status]}>
                  {machineStatusLabels[machine.status]}
                </Tag>
              </div>
            ))}
          </Card>
        </Col>
        <Col lg={12}>
          <Card title="最近订单" size="small">
            <Table
              dataSource={recentOrders}
              rowKey="id"
              size="small"
              pagination={false}
              columns={orderColumns}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
