'use client';

import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import type { Workspace } from '@/lib/types';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selected, setSelected] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createForm] = Form.useForm();
  const [memberForm] = Form.useForm();

  async function loadList() {
    const list = await api<Workspace[]>('/workspaces');
    setWorkspaces(list);
  }

  async function openWorkspace(id: string) {
    const ws = await api<Workspace>(`/workspaces/${id}`);
    setSelected(ws);
  }

  useEffect(() => {
    void loadList().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load'),
    );
  }, []);

  async function createWorkspace(values: { name: string }) {
    setLoading(true);
    try {
      const ws = await api<Workspace>('/workspaces', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      createForm.resetFields();
      setCreateOpen(false);
      await loadList();
      await openWorkspace(ws.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  }

  async function addMember(values: { email: string; role: string }) {
    if (!selected) return;
    setLoading(true);
    try {
      await api(`/workspaces/${selected.id}/members`, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      memberForm.resetFields();
      setMemberOpen(false);
      await openWorkspace(selected.id);
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add member failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Workspaces"
      extra={
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          New workspace
        </Button>
      }
    >
      {error ? (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError('')}
        />
      ) : null}

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card title="Your workspaces">
          <Table
            rowKey="id"
            dataSource={workspaces}
            pagination={false}
            onRow={(row) => ({
              onClick: () => void openWorkspace(row.id),
              style: { cursor: 'pointer' },
            })}
            columns={[
              { title: 'Name', dataIndex: 'name' },
              {
                title: 'Projects',
                dataIndex: ['_count', 'projects'],
                width: 100,
              },
              {
                title: 'Members',
                dataIndex: 'members',
                render: (members: Workspace['members']) => members?.length ?? '—',
                width: 100,
              },
            ]}
          />
        </Card>

        {selected ? (
          <Card
            title={
              <Space>
                <Typography.Text strong>{selected.name}</Typography.Text>
                <Tag>RBAC</Tag>
              </Space>
            }
            extra={
              <Button onClick={() => setMemberOpen(true)}>Add member</Button>
            }
          >
            <Typography.Paragraph type="secondary">
              Roles: OWNER / ADMIN can invite. Members access projects and tasks in this workspace.
            </Typography.Paragraph>
            <Table
              rowKey="id"
              dataSource={selected.members ?? []}
              pagination={false}
              columns={[
                { title: 'Name', dataIndex: ['user', 'name'] },
                { title: 'Email', dataIndex: ['user', 'email'] },
                {
                  title: 'Role',
                  dataIndex: 'role',
                  render: (role: string) => <Tag color="blue">{role}</Tag>,
                },
              ]}
            />
          </Card>
        ) : null}
      </Space>

      <Modal
        title="New workspace"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" onFinish={createWorkspace}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Create
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Add member"
        open={memberOpen}
        onCancel={() => setMemberOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={memberForm}
          layout="vertical"
          onFinish={addMember}
          initialValues={{ role: 'MEMBER' }}
        >
          <Form.Item name="email" label="User email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="registered user email" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'MEMBER', label: 'MEMBER' },
                { value: 'ADMIN', label: 'ADMIN' },
                { value: 'OWNER', label: 'OWNER' },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Add
          </Button>
        </Form>
      </Modal>
    </AppShell>
  );
}
