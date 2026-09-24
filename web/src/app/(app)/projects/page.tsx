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
  Table,
} from 'antd';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { api } from '@/lib/api';
import type { Project, Workspace } from '@/lib/types';

export default function ProjectsPage() {
  const router = useRouter();
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
      const [p, w] = await Promise.all([
        api<Project[]>(`/projects${qs}`),
        api<Workspace[]>('/workspaces'),
      ]);
      setProjects(p);
      setWorkspaces(w);
      if (!workspaceId && w[0]) setWorkspaceId(w[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
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

  return (
    <AppShell
      title="Projects"
      extra={
        <Select
          style={{ minWidth: 180, width: '100%', maxWidth: 240 }}
          placeholder="Filter workspace"
          allowClear
          value={workspaceId}
          onChange={setWorkspaceId}
          options={workspaces.map((w) => ({ value: w.id, label: w.name }))}
          aria-label="Filter by workspace"
        />
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

      {loading && !projects.length ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="All projects">
              <Table
                rowKey="id"
                loading={loading}
                dataSource={projects}
                scroll={{ x: 520 }}
                pagination={{ pageSize: 8, simple: true }}
                locale={{
                  emptyText: (
                    <Empty
                      description="No projects in this workspace"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
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
                    width: 120,
                    render: (_, row) => (
                      <Button
                        type="primary"
                        size="middle"
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
          <Col xs={24} lg={8}>
            <Card title="New project">
              <Form form={form} layout="vertical" onFinish={createProject} requiredMark={false}>
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
      )}
    </AppShell>
  );
}
