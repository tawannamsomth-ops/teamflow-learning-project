'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Row,
  Select,
  Skeleton,
  Statistic,
  Table,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import type { Project, Stats, Workspace } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  async function load(wsId?: string) {
    setLoading(true);
    try {
      const qs = wsId ? `?workspaceId=${wsId}` : '';
      const [s, p, w] = await Promise.all([
        api<Stats>(`/dashboard/stats${qs}`),
        api<Project[]>(`/projects${qs}`),
        api<Workspace[]>('/workspaces'),
      ]);
      setStats(s);
      setProjects(p);
      setWorkspaces(w);
      if (!workspaceId && w[0]) setWorkspaceId(w[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(workspaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function createProject(values: { name: string; description?: string }) {
    const ws = workspaceId ?? workspaces[0]?.id;
    if (!ws) {
      setError('Create a workspace first');
      return;
    }
    setCreating(true);
    try {
      const project = await api<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify({ ...values, workspaceId: ws }),
      });
      form.resetFields();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project');
    } finally {
      setCreating(false);
    }
  }

  const workspaceFilter = (
    <Select
      style={{ minWidth: 180, width: '100%', maxWidth: 240 }}
      placeholder="All workspaces"
      allowClear
      value={workspaceId}
      onChange={setWorkspaceId}
      options={workspaces.map((w) => ({ value: w.id, label: w.name }))}
      aria-label="Filter by workspace"
    />
  );

  return (
    <AppShell title="Dashboard" extra={workspaceFilter}>
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

      {loading && !stats ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={12} md={6}>
              <Card size="small">
                <Statistic title="Projects" value={stats?.projects ?? 0} />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card size="small">
                <Statistic title="Assigned to me" value={stats?.assignedToMe ?? 0} />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card size="small">
                <Statistic title="Overdue" value={stats?.overdue ?? 0} />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card size="small">
                <Statistic
                  title="In progress"
                  value={stats?.tasksByStatus?.IN_PROGRESS ?? 0}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={15}>
              <Card title="Recent projects">
                <Table
                  rowKey="id"
                  size="middle"
                  loading={loading}
                  dataSource={projects}
                  locale={{
                    emptyText: (
                      <Empty
                        description="No projects yet"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      >
                        <Typography.Text type="secondary">
                          Create one on the right to open a board
                        </Typography.Text>
                      </Empty>
                    ),
                  }}
                  pagination={{ pageSize: 6, simple: true, hideOnSinglePage: true }}
                  scroll={{ x: 480 }}
                  columns={[
                    {
                      title: 'Name',
                      dataIndex: 'name',
                      render: (name, row) => (
                        <Link href={`/projects/${row.id}`}>{name}</Link>
                      ),
                    },
                    {
                      title: 'Workspace',
                      dataIndex: ['workspace', 'name'],
                      responsive: ['sm'],
                    },
                    {
                      title: 'Tasks',
                      dataIndex: ['_count', 'tasks'],
                      align: 'right',
                      width: 80,
                    },
                    {
                      title: '',
                      width: 110,
                      render: (_, row) => (
                        <Button
                          type="link"
                          onClick={() => router.push(`/projects/${row.id}`)}
                        >
                          Open board
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={9}>
              <Card title="New project">
                <Form form={form} layout="vertical" onFinish={createProject} requiredMark={false}>
                  <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                    <Input placeholder="Launch checklist" />
                  </Form.Item>
                  <Form.Item name="description" label="Description">
                    <Input.TextArea rows={3} placeholder="Optional notes" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={creating}>
                    Create project
                  </Button>
                </Form>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </AppShell>
  );
}
