import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tag,
  message,
  Space,
  Card,
  Row,
  Col,
  Descriptions,
  List,
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { orderApi, machineApi, tagApi } from '../services/api'
import dayjs from 'dayjs'

function Orders() {
  const [orders, setOrders] = useState([])
  const [machines, setMachines] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
  const [machineFilter, setMachineFilter] = useState(null)
  const [createForm] = Form.useForm()
  const [orderItems, setOrderItems] = useState([{ tag_id: null, quantity: 1 }])

  useEffect(() => {
    loadMachines()
    loadTags()
  }, [])

  useEffect(() => {
    loadOrders()
  }, [statusFilter, machineFilter])

  const loadMachines = async () => {
    try {
      const data = await machineApi.list()
      setMachines(data)
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

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (machineFilter) params.machine_id = machineFilter
      const data = await orderApi.list(params)
      setOrders(data)
    } catch (error) {
      message.error('加载订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    createForm.resetFields()
    createForm.setFieldsValue({
      machine_id: machines[0]?.id,
      user_id: '',
      remark: '',
    })
    setOrderItems([{ tag_id: null, quantity: 1 }])
    setCreateModalVisible(true)
  }

  const handleViewDetail = async (record) => {
    try {
      const data = await orderApi.get(record.id)
      setSelectedOrder(data)
      setDetailModalVisible(true)
    } catch (error) {
      message.error('加载订单详情失败')
    }
  }

  const handleDispense = async (record) => {
    try {
      message.loading('正在执行出货...', 0)
      const data = await orderApi.dispense(record.id)
      message.destroy()
      message.success('出货完成')
      setSelectedOrder(data)
      loadOrders()
    } catch (error) {
      message.destroy()
      message.error(error.response?.data?.detail || '出货失败')
    }
  }

  const handleCancel = async (record) => {
    try {
      await orderApi.cancel(record.id)
      message.success('订单已取消')
      loadOrders()
    } catch (error) {
      message.error('取消失败')
    }
  }

  const handleCreateOrder = async () => {
    try {
      const values = await createForm.validateFields()

      if (orderItems.length === 0 || !orderItems[0].tag_id) {
        message.warning('请至少添加一个订单项')
        return
      }

      const submitData = {
        ...values,
        items: orderItems.filter((item) => item.tag_id),
      }

      await orderApi.create(submitData)
      message.success('订单创建成功')
      setCreateModalVisible(false)
      loadOrders()
    } catch (error) {
      if (error.errorFields) return
      message.error('创建订单失败')
    }
  }

  const addOrderItem = () => {
    setOrderItems([...orderItems, { tag_id: null, quantity: 1 }])
  }

  const removeOrderItem = (index) => {
    const newItems = orderItems.filter((_, i) => i !== index)
    setOrderItems(newItems)
  }

  const updateOrderItem = (index, field, value) => {
    const newItems = [...orderItems]
    newItems[index][field] = value
    setOrderItems(newItems)
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

  const getMachineName = (machineId) => {
    const machine = machines.find((m) => m.id === machineId)
    return machine ? `${machine.code} - ${machine.name}` : '-'
  }

  const getTagInfo = (tagId) => {
    return tags.find((t) => t.id === tagId)
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 200,
    },
    {
      title: '机器',
      dataIndex: 'machine_id',
      key: 'machine_id',
      render: (machineId) => getMachineName(machineId),
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
      render: (status) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {(record.status === 'pending' || record.status === 'failed') && (
            <Button
              type="text"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleDispense(record)}
            >
              出货
            </Button>
          )}
          {(record.status === 'pending' || record.status === 'failed') && (
            <Button
              type="text"
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleCancel(record)}
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>订单管理</h2>
        <Space>
          <Select
            style={{ width: 150 }}
            placeholder="状态筛选"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'pending', label: '待处理' },
              { value: 'dispensing', label: '出货中' },
              { value: 'completed', label: '已完成' },
              { value: 'failed', label: '失败' },
              { value: 'cancelled', label: '已取消' },
            ]}
          />
          <Select
            style={{ width: 200 }}
            placeholder="机器筛选"
            allowClear
            value={machineFilter}
            onChange={setMachineFilter}
            options={machines.map((m) => ({ value: m.id, label: `${m.code} - ${m.name}` }))}
          />
          <Button icon={<ReloadOutlined />} onClick={loadOrders}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建订单
          </Button>
        </Space>
      </div>

      <Table
        dataSource={orders}
        rowKey="id"
        loading={loading}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建订单"
        open={createModalVisible}
        onOk={handleCreateOrder}
        onCancel={() => setCreateModalVisible(false)}
        okText="创建"
        cancelText="取消"
        width={600}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="machine_id"
            label="选择机器"
            rules={[{ required: true, message: '请选择机器' }]}
          >
            <Select placeholder="请选择机器">
              {machines.map((m) => (
              <Select.Option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </Select.Option>
            ))}
            </Select>
          </Form.Item>
          <Form.Item name="user_id" label="用户ID">
            <Input placeholder="请输入用户ID" maxLength={50} />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>
              订单项
            </div>
            <List
              size="small"
              dataSource={orderItems}
              renderItem={(item, index) => (
                <List.Item
                actions={[
                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={() => removeOrderItem(index)}
                  >
                    删除
                  </Button>,
                ]}
              >
                <Space style={{ width: '100%' }}>
                  <Select
                    style={{ width: 200 }}
                    placeholder="选择标签"
                    value={item.tag_id}
                    onChange={(value) => updateOrderItem(index, 'tag_id', value)}
                  >
                    {tags.map((tag) => (
                      <Select.Option key={tag.id} value={tag.id}>
                        <Tag color={tag.color}>{tag.name}</Tag>
                      </Select.Option>
                    ))}
                  </Select>
                  <span>数量:</span>
                  <InputNumber
                    min={1}
                    max={10}
                    value={item.quantity}
                    onChange={(value) => updateOrderItem(index, 'quantity', value || 1)}
                  />
                </Space>
              </List.Item>
              )}
            />
            <Button
              type="dashed"
              style={{ width: '100%', marginTop: 8 }}
              icon={<PlusOutlined />}
              onClick={addOrderItem}
            >
              添加订单项
            </Button>
          </div>

          <Form.Item name="remark" label="备注">
            <Input.TextArea placeholder="请输入备注" rows={2} maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedOrder &&
            (selectedOrder.status === 'pending' || selectedOrder.status === 'failed') && (
            <Button
              key="dispense"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleDispense(selectedOrder)}
            >
              执行出货
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedOrder && (
          <div>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="订单号">
                {selectedOrder.order_no}
              </Descriptions.Item>
              <Descriptions.Item label="机器">
                {getMachineName(selectedOrder.machine_id)}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[selectedOrder.status]}>
                  {statusLabels[selectedOrder.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="总数量">
                {selectedOrder.total_quantity}
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">
                {selectedOrder.user_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注">
                {selectedOrder.remark || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>订单项</div>
              <List
                size="small"
                bordered
                dataSource={selectedOrder.items}
                renderItem={(item) => {
                  const tag = getTagInfo(item.tag_id)
                  return (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <Tag color={tag?.color}>{tag?.name || '未知'}</Tag>
                          <span>数量: {item.quantity}</span>
                        </Space>
                        <Tag color={statusColors[item.status]}>
                          {statusLabels[item.status]}
                        </Tag>
                      </Space>
                    </List.Item>
                  )
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Orders
