import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Tag,
  message,
  Space,
  Popconfirm,
  Card,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import { channelApi, machineApi, tagApi } from '../services/api'

function Channels() {
  const [channels, setChannels] = useState([])
  const [machines, setMachines] = useState([])
  const [tags, setTags] = useState([])
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingChannel, setEditingChannel] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadMachines()
    loadTags()
  }, [])

  const loadMachines = async () => {
    try {
      const data = await machineApi.list()
      setMachines(data)
      if (data.length > 0 && !selectedMachine) {
        setSelectedMachine(data[0].id)
      }
    } catch (error) {
      message.error('加载机器列表失败')
    }
  }

  const loadTags = async () => {
    try {
      const data = await tagApi.list()
      setTags(data)
    } catch (error) {
      message.error('加载标签列表失败')
    }
  }

  useEffect(() => {
    if (selectedMachine) {
      loadChannels()
    }
  }, [selectedMachine])

  const loadChannels = async () => {
    if (!selectedMachine) return
    setLoading(true)
    try {
      const data = await channelApi.listByMachine(selectedMachine)
      setChannels(data)
    } catch (error) {
      message.error('加载货道列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingChannel(null)
    form.resetFields()
    form.setFieldsValue({
      machine_id: selectedMachine,
      stock: 0,
      max_stock: 10,
      is_enabled: true,
    })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingChannel(record)
    form.setFieldsValue({
      channel_code: record.channel_code,
      tag_id: record.tag_id,
      stock: record.stock,
      max_stock: record.max_stock,
      is_enabled: record.is_enabled,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await channelApi.delete(id)
      message.success('删除成功')
      loadChannels()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleAddStock = async (record, quantity = 1) => {
    try {
      await channelApi.addStock(record.id, quantity)
      message.success('补货成功')
      loadChannels()
    } catch (error) {
      message.error('补货失败')
    }
  }

  const handleReduceStock = async (record, quantity = 1) => {
    try {
      await channelApi.reduceStock(record.id, quantity)
      message.success('减货成功')
      loadChannels()
    } catch (error) {
      message.error('减货失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingChannel) {
        await channelApi.update(editingChannel.id, values)
        message.success('更新成功')
      } else {
        await channelApi.create({ ...values, machine_id: selectedMachine })
        message.success('创建成功')
      }

      setModalVisible(false)
      loadChannels()
    } catch (error) {
      if (error.errorFields) return
      message.error(editingChannel ? '更新失败' : '创建失败')
    }
  }

  const getTagInfo = (tagId) => {
    return tags.find((t) => t.id === tagId)
  }

  const statusColors = {
    normal: 'green',
    fault: 'red',
    disabled: 'default',
  }

  const statusLabels = {
    normal: '正常',
    fault: '故障',
    disabled: '禁用',
  }

  const columns = [
    {
      title: '货道编号',
      dataIndex: 'channel_code',
      key: 'channel_code',
      width: 120,
    },
    {
      title: '标签',
      dataIndex: 'tag_id',
      key: 'tag_id',
      render: (tagId) => {
        const tag = getTagInfo(tagId)
        if (!tag) return <Tag color="default">未设置</Tag>
        return (
          <Tag color={tag.color} style={{ backgroundColor: tag.color + '20' }}>
            {tag.name}
          </Tag>
        )
      },
    },
    {
      title: '当前库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (stock, record) => {
        let color = 'green'
        if (stock === 0) color = 'red'
        else if (stock <= 2) color = 'orange'
        return <Tag color={color}>{stock}</Tag>
      },
    },
    {
      title: '最大库存',
      dataIndex: 'max_stock',
      key: 'max_stock',
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
      title: '上次出货',
      dataIndex: 'last_dispense_at',
      key: 'last_dispense_at',
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<PlusCircleOutlined />}
            onClick={() => handleAddStock(record, 1)}
          >
            +1
          </Button>
          <Button
            type="text"
            size="small"
            icon={<MinusCircleOutlined />}
            onClick={() => handleReduceStock(record, 1)}
            disabled={record.stock === 0}
          >
            -1
          </Button>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个货道吗？"
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

  const totalStock = channels.reduce((sum, c) => sum + c.stock, 0)
  const enabledCount = channels.filter((c) => c.is_enabled).length

  return (
    <div>
      <div className="page-header">
        <h2>货道管理</h2>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder="选择机器"
            value={selectedMachine}
            onChange={setSelectedMachine}
            options={machines.map((m) => ({ value: m.id, label: `${m.code} - ${m.name}` }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建货道
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={8} md={6}>
          <Card size="small">
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>货道总数</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
              {channels.length}
            </div>
          </Card>
        </Col>
        <Col xs={8} md={6}>
          <Card size="small">
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>已启用</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{enabledCount}</div>
          </Card>
        </Col>
        <Col xs={8} md={6}>
          <Card size="small">
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>总库存</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{totalStock}</div>
          </Card>
        </Col>
      </Row>

      <Table
        dataSource={channels}
        rowKey="id"
        loading={loading}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingChannel ? '编辑货道' : '新建货道'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="channel_code"
            label="货道编号"
            rules={[{ required: true, message: '请输入货道编号' }]}
          >
            <Input
              placeholder="请输入货道编号，如 A001"
              maxLength={50}
              disabled={!!editingChannel}
            />
          </Form.Item>
          <Form.Item name="tag_id" label="图书标签">
            <Select placeholder="请选择标签" allowClear>
              {tags.map((tag) => (
                <Select.Option key={tag.id} value={tag.id}>
                  <Tag color={tag.color}>{tag.name}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="stock" label="当前库存">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="max_stock" label="最大库存">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="is_enabled" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Channels
