import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, ColorPicker, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { tagApi } from '../services/api'

function Tags() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    setLoading(true)
    try {
      const data = await tagApi.list()
      setTags(data)
    } catch (error) {
      message.error('加载标签列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingTag(null)
    form.resetFields()
    form.setFieldsValue({ color: '#3b82f6' })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingTag(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      color: record.color,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await tagApi.delete(id)
      message.success('删除成功')
      loadTags()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        color: typeof values.color === 'string' ? values.color : values.color.toHexString(),
      }

      if (editingTag) {
        await tagApi.update(editingTag.id, submitData)
        message.success('更新成功')
      } else {
        await tagApi.create(submitData)
        message.success('创建成功')
      }

      setModalVisible(false)
      loadTags()
    } catch (error) {
      if (error.errorFields) return
      message.error(editingTag ? '更新失败' : '创建失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (color) => (
        <Space>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              backgroundColor: color,
              border: '1px solid #ddd',
            }}
          />
          <span style={{ fontSize: 12, color: '#999' }}>{color}</span>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个标签吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
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
        <h2>标签管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建标签
        </Button>
      </div>

      <Table
        dataSource={tags}
        rowKey="id"
        loading={loading}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingTag ? '编辑标签' : '新建标签'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="请输入标签名称" maxLength={50} />
          </Form.Item>
          <Form.Item name="color" label="标签颜色">
            <ColorPicker format="hex" showText />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入标签描述" rows={3} maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Tags
