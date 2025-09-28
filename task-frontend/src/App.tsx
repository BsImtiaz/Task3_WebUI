import React, { useState, useEffect } from 'react';
import {
  Layout, Card, Button, Form, Input, Table, Modal, message,
  Space, Popconfirm, Typography, Divider, Tag, Collapse
} from 'antd';
import { PlayCircleOutlined, DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Panel } = Collapse;

interface Task {
  id: string;
  name: string;
  owner: string;
  command: string;
  taskExecutions: TaskExecution[];
}

interface TaskExecution {
  startTime: string;
  endTime: string;
  output: string;
}

// Update this URL to point to your Kubernetes service
const API_BASE_URL = 'http://localhost:8080/tasks';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  // Load all tasks
  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Task[]>(API_BASE_URL);
      setTasks(response.data);
    } catch (error) {
      message.error('Failed to load tasks');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Search tasks
  const searchTasks = async () => {
    if (!searchTerm.trim()) {
      loadTasks();
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get<Task[]>(`${API_BASE_URL}/search?name=${searchTerm}`);
      setTasks(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setTasks([]);
        message.info('No tasks found');
      } else {
        message.error('Search failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create or update task
  const saveTask = async (values: any) => {
    try {
      const taskData = {
        id: editingTask?.id,
        ...values,
        taskExecutions: editingTask?.taskExecutions || []
      };
      
      await axios.put(API_BASE_URL, taskData);
      message.success(editingTask ? 'Task updated successfully' : 'Task created successfully');
      setModalVisible(false);
      setEditingTask(null);
      form.resetFields();
      loadTasks();
    } catch (error: any) {
      if (error.response?.data === 'Unsafe command') {
        message.error('Unsafe command detected. Please use safe commands only.');
      } else {
        message.error('Failed to save task');
      }
    }
  };

  // Delete task
  const deleteTask = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      message.success('Task deleted successfully');
      loadTasks();
    } catch (error) {
      message.error('Failed to delete task');
    }
  };

  // Execute task
  const executeTask = async (id: string) => {
    try {
      await axios.put(`${API_BASE_URL}/${id}/executions`);
      message.success('Task executed successfully');
      loadTasks(); // Reload to see execution results
    } catch (error: any) {
      if (error.response?.data?.includes?.('Unsafe command')) {
        message.error('Cannot execute unsafe command');
      } else {
        message.error('Failed to execute task');
      }
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingTask(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Open edit modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue(task);
    setModalVisible(true);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
    },
    {
      title: 'Command',
      dataIndex: 'command',
      key: 'command',
      render: (text: string) => (
        <Text code style={{ maxWidth: 200, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {text}
        </Text>
      )
    },
    {
      title: 'Executions',
      dataIndex: 'taskExecutions',
      key: 'executions',
      render: (executions: TaskExecution[]) => (
        <Tag color={executions.length > 0 ? 'green' : 'default'}>
          {executions.length}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Task) => (
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => executeTask(record.id)}
            size="small"
            title="Execute Task"
          >
            Run
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            size="small"
            title="Edit Task"
          />
          <Popconfirm
            title="Are you sure you want to delete this task?"
            onConfirm={() => deleteTask(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              title="Delete Task"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const expandedRowRender = (record: Task) => {
    if (!record.taskExecutions || record.taskExecutions.length === 0) {
      return <Text type="secondary">No executions yet</Text>;
    }

    return (
      <Collapse size="small" ghost>
        {record.taskExecutions.map((execution, index) => (
          <Panel
            header={
              <Space>
                <Text strong>Execution #{index + 1}</Text>
                <Text type="secondary">
                  {new Date(execution.startTime).toLocaleString()}
                </Text>
              </Space>
            }
            key={index}
          >
            <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
              <Text strong>Duration: </Text>
              <Text>
                {Math.round((new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()) / 1000)}s
              </Text>
              <Divider />
              <Text strong>Output:</Text>
              <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {execution.output || 'No output'}
              </pre>
            </div>
          </Panel>
        ))}
      </Collapse>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          Task Manager - Kaiburr
        </Title>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Card>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button type="primary" onClick={openCreateModal}>
              Create New Task
            </Button>
            
            <Input.Search
              placeholder="Search tasks by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={searchTasks}
              style={{ width: 300 }}
              enterButton={<SearchOutlined />}
            />
            
            <Button onClick={loadTasks}>
              Refresh
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            loading={loading}
            expandable={{
              expandedRowRender,
              expandRowByClick: true,
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} tasks`
            }}
          />
        </Card>

        <Modal
          title={editingTask ? 'Edit Task' : 'Create New Task'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingTask(null);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={saveTask}
            requiredMark="optional"
          >
            <Form.Item
              name="name"
              label="Task Name"
              rules={[{ required: true, message: 'Please enter task name' }]}
            >
              <Input placeholder="Enter task name" />
            </Form.Item>

            <Form.Item
              name="owner"
              label="Owner"
              rules={[{ required: true, message: 'Please enter owner name' }]}
            >
              <Input placeholder="Enter owner name" />
            </Form.Item>

            <Form.Item
              name="command"
              label="Command"
              rules={[{ required: true, message: 'Please enter command to execute' }]}
              extra="Safe commands only (no special characters like ;, &, |, `, $, >, <)"
            >
              <Input.TextArea 
                placeholder="Enter command to execute (e.g., echo 'Hello World')"
                rows={3}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingTask ? 'Update Task' : 'Create Task'}
                </Button>
                <Button onClick={() => {
                  setModalVisible(false);
                  setEditingTask(null);
                  form.resetFields();
                }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}

export default App;