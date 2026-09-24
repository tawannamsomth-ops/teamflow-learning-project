'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Statistic,
  Table,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
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
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  async function load(wsId?: string) {
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
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  useEffect(() => {
    void load(workspaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const statusBreakdown = useMemo(() => {
    const m = stats?.tasksByStatus ?? {};
    return Object.entries(m)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ') || 'No tasks yet';
  }, [stats]);

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
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell
      title="Dashboard"
      extra={
        <Select
          style={{ width: 220 }}
          placeholder="All workspaces"
          allowClear
          value={workspaceId}
          onChange={(v) => setWorkspaceId(v)}
          options={workspaces.map((w) => ({ value: w.id, label: w.name }))}
        />
      }
    >
      {error ? (
        <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable onClose={() => setError('')} />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card><Statistic title="Projects" value={stats?.projects ?? 0} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title="Assigned to me" value={stats?.assignedToMe ?? 0} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title="Overdue" value={stats?.overdue ?? 0} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="In progress" value={stats?.tasksByStatus?.IN_PROGRESS ?? 0} />
          </Card>
        </Col>
      </Row>

      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Task status mix — {statusBreakdown}
      </Typography.Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Projects">
            <Table
              rowKey="id"
              dataSource={projects}
              pagination={{ pageSize: 8 }}
              columns={[
                {
                  title: 'Name',
                  dataIndex: 'name',
                  render: (name, row) => (
                    <Link href={`/projects/${row.id}`}>{name}</Link>
                  ),
                },
                { title: 'Workspace', dataIndex: ['workspace', 'name'] },
                { title: 'Tasks', dataIndex: ['_count', 'tasks'], width: 90 },
                {
                  title: '',
                  width: 100,
                  render: (_, row) => (
                    <Button type="link" onClick={() => router.push(`/projects/${row.id}`)}>
                      Open board
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="New project">
            <Form form={form} layout="vertical" onFinish={createProject}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input placeholder="Project name" />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={creating}>
                Create project
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </AppShell>
  );
}
