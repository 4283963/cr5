import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Tag,
  message,
  Space,
  Popconfirm,
  Card,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { machineApi } from '../services/api'

function Machines() {
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingMachine, setEditingMachine] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadMachines()
  }, [])

  const loadMachines = async () => {
    setLoading(true)
    try {
      const data = await machineApi.list()
      setMachines(data)
    } catch (error) {
      message.error('加载机器列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingMachine(null)
    form.resetFields()
    form.setFieldsValue({ is_enabled: true, total_channels: 10 })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingMachine(record)
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      location: record.location,
      ip_address: record.ip_address,
      total_channels: record.total_channels,
      is_enabled: record.is_enabled,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await machineApi.delete(id)
      message.success('删除成功')
      loadMachines()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleToggleOnline = async (record, online) => {
    try {
      if (online) {
        await machineApi.setOnline(record.id)
        message.success('机器已上线')
      } else {
        await machineApi.setOffline(record.id)
        message.success('机器已下线')
      }
      loadMachines()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingMachine) {
        await machineApi.update(editingMachine.id, values)
        message.success('更新成功')
      } else {
        await machineApi.create(values)
        message.success('创建成功')
      }

      setModalVisible(false)
      loadMachines()
    } catch (error) {
      if (error.errorFields) return
      message.error(editingMachine ? '更新失败' : '创建失败')
    }
  }

  const statusColors = {
    online: 'green',
    offline: 'default',
  }

  const statusLabels = {
    online: '在线',
    offline: '离线',
  }

  const columns = [
    {
      title: '机器编号',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '机器名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
    },
    {
      title: '货道数',
      dataIndex: 'total_channels',
      key: 'total_channels',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: '启用',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      width: 80,
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'default'}>{enabled ? '是' : '否'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'online' ? (
            <Button
              type="text"
              size="small"
              icon={<PoweroffOutlined />}
              onClick={() => handleToggleOnline(record, false)}
            >
              下线
            </Button>
          ) : (
            <Button
              type="text"
              size="small"
              icon={<PoweroffOutlined />}
              onClick={() => handleToggleOnline(record, true)}
            >
              上线
            </Button>
          )}
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这台机器吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>机器管理</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadMachines}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建机器
          </Button>
        </Space>
      </div>

      <Table
        dataSource={machines}
        rowKey="id"
        loading={loading}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingMachine ? '编辑机器' : '新建机器'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="机器编号"
            rules={[{ required: true, message: '请输入机器编号' }]}
          >
            <Input placeholder="请输入机器编号，如 M001" maxLength={50} disabled={!!editingMachine} />
          </Form.Item>
          <Form.Item
            name="name"
            label="机器名称"
            rules={[{ required: true, message: '请输入机器名称' }]}
          >
            <Input placeholder="请输入机器名称" maxLength={100} />
          </Form.Item>
          <Form.Item name="location" label="安装位置">
            <Input placeholder="请输入安装位置" maxLength={200} />
          </Form.Item>
          <Form.Item name="ip_address" label="IP地址">
            <Input placeholder="请输入机器IP地址" maxLength={50} />
          </Form.Item>
          <Form.Item name="total_channels" label="货道总数">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_enabled" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Machines
