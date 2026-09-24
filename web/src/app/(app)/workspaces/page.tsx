'use client';

import {
  Alert,
  Button,
  Card,
  Divider,
  Empty,
  Form,
  Grid,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { api, getStoredUser } from '@/lib/api';
import type { Workspace } from '@/lib/types';

export default function WorkspacesPage() {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [editing, setEditing] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [memberForm] = Form.useForm();
  const me = getStoredUser();

  async function loadList() {
    setLoading(true);
    try {
      const list = await api<Workspace[]>('/workspaces');
      setWorkspaces(list);
      return list;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadList().catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load'),
    );
  }, []);

  function myRole(ws: Workspace) {
    return ws.members?.find((m) => m.user.id === me?.id)?.role;
  }

  function canManage(ws: Workspace) {
    const role = myRole(ws);
    return role === 'OWNER' || role === 'ADMIN';
  }

  async function openEdit(ws: Workspace) {
    setSaving(true);
    try {
      const fresh = await api<Workspace>(`/workspaces/${ws.id}`);
      setEditing(fresh);
      editForm.setFieldsValue({ name: fresh.name });
      memberForm.resetFields();
      memberForm.setFieldsValue({ role: 'MEMBER' });
      setEditOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open workspace');
    } finally {
      setSaving(false);
    }
  }

  async function createWorkspace(values: { name: string }) {
    setSaving(true);
    try {
      const ws = await api<Workspace>('/workspaces', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      createForm.resetFields();
      setCreateOpen(false);
      message.success('Workspace created');
      await loadList();
      await openEdit(ws);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  }

  async function updateWorkspace(values: { name: string }) {
    if (!editing) return;
    setSaving(true);
    try {
      const ws = await api<Workspace>(`/workspaces/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(values),
      });
      message.success('Name saved');
      await loadList();
      const fresh = await api<Workspace>(`/workspaces/${ws.id}`);
      setEditing(fresh);
      editForm.setFieldsValue({ name: fresh.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorkspace(id: string) {
    setSaving(true);
    try {
      await api(`/workspaces/${id}`, { method: 'DELETE' });
      message.success('Workspace deleted');
      if (editing?.id === id) {
        setEditOpen(false);
        setEditing(null);
      }
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setSaving(false);
    }
  }

  async function addMember(values: { email: string; role: string }) {
    if (!editing) return;
    setSaving(true);
    try {
      await api(`/workspaces/${editing.id}/members`, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      memberForm.resetFields();
      memberForm.setFieldsValue({ role: 'MEMBER' });
      message.success('Member added');
      const fresh = await api<Workspace>(`/workspaces/${editing.id}`);
      setEditing(fresh);
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add member failed');
    } finally {
      setSaving(false);
    }
  }

  function actionsFor(row: Workspace) {
    const canDelete = myRole(row) === 'OWNER';
    return (
      <Space
        size={8}
        wrap
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Button size="middle" onClick={() => void openEdit(row)}>
          Edit
        </Button>
        <Popconfirm
          title="Delete this workspace?"
          description="Projects and tasks inside will be removed."
          okText="Delete"
          okButtonProps={{ danger: true }}
          disabled={!canDelete}
          onConfirm={() => void deleteWorkspace(row.id)}
        >
          <Button size="middle" danger disabled={!canDelete}>
            Delete
          </Button>
        </Popconfirm>
      </Space>
    );
  }

  const manage = editing ? canManage(editing) : false;

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
          showIcon
          message={error}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError('')}
        />
      ) : null}

      <Card title="Your workspaces">
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : isMobile ? (
          <List
            locale={{
              emptyText: (
                <Empty
                  description="No workspaces yet"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary" onClick={() => setCreateOpen(true)}>
                    Create workspace
                  </Button>
                </Empty>
              ),
            }}
            dataSource={workspaces}
            renderItem={(row) => (
              <List.Item
                actions={[actionsFor(row)]}
                onClick={() => void openEdit(row)}
                style={{ cursor: 'pointer' }}
              >
                <List.Item.Meta
                  title={row.name}
                  description={`${row._count?.projects ?? 0} projects · ${row.members?.length ?? 0} members`}
                />
              </List.Item>
            )}
          />
        ) : (
          <Table
            rowKey="id"
            dataSource={workspaces}
            pagination={false}
            locale={{
              emptyText: (
                <Empty description="No workspaces yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ),
            }}
            onRow={(row) => ({
              onClick: () => void openEdit(row),
              style: { cursor: 'pointer' },
            })}
            columns={[
              { title: 'Name', dataIndex: 'name' },
              {
                title: 'Projects',
                dataIndex: ['_count', 'projects'],
                align: 'right',
                width: 100,
              },
              {
                title: 'Members',
                dataIndex: 'members',
                align: 'right',
                width: 100,
                render: (members: Workspace['members']) => members?.length ?? 0,
              },
              {
                title: 'Actions',
                width: 200,
                render: (_, row) => actionsFor(row),
              },
            ]}
          />
        )}
      </Card>

      <Modal
        title="New workspace"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
        width={isMobile ? '100%' : 420}
      >
        <Form form={createForm} layout="vertical" onFinish={createWorkspace} requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Acme Product" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} block>
            Create workspace
          </Button>
        </Form>
      </Modal>

      <Modal
        title={
          <Space wrap>
            <span>Edit workspace</span>
            {editing ? <Tag>RBAC</Tag> : null}
          </Space>
        }
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        footer={null}
        destroyOnHidden
        width={isMobile ? '100%' : 560}
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}
      >
        {editing ? (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Form
              form={editForm}
              layout="vertical"
              onFinish={updateWorkspace}
              requiredMark={false}
              disabled={!manage}
            >
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              {manage ? (
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save name
                </Button>
              ) : null}
            </Form>

            <Divider style={{ margin: 0 }} />

            <div>
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                Members
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                OWNER/ADMIN can invite. Only OWNER can delete the workspace.
              </Typography.Paragraph>
              <Table
                rowKey="id"
                size="small"
                dataSource={editing.members ?? []}
                pagination={false}
                scroll={{ x: 360 }}
                columns={[
                  { title: 'Name', dataIndex: ['user', 'name'] },
                  {
                    title: 'Email',
                    dataIndex: ['user', 'email'],
                    ellipsis: true,
                  },
                  {
                    title: 'Role',
                    dataIndex: 'role',
                    width: 110,
                    render: (role: string) => <Tag color="blue">{role}</Tag>,
                  },
                ]}
              />
            </div>

            {manage ? (
              <>
                <Divider style={{ margin: 0 }} />
                <Form
                  form={memberForm}
                  layout="vertical"
                  onFinish={addMember}
                  initialValues={{ role: 'MEMBER' }}
                  requiredMark={false}
                >
                  <Typography.Title level={5} style={{ marginTop: 0 }}>
                    Add member
                  </Typography.Title>
                  <Form.Item
                    name="email"
                    label="User email"
                    rules={[{ required: true, type: 'email' }]}
                  >
                    <Input placeholder="teammate@company.com" inputMode="email" />
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
                  <Button type="primary" htmlType="submit" loading={saving} block>
                    Add member
                  </Button>
                </Form>
              </>
            ) : null}
          </Space>
        ) : null}
      </Modal>
    </AppShell>
  );
}
