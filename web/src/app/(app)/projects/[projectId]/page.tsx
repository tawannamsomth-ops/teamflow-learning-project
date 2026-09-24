'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Empty,
  Grid,
  Input,
  Select,
  Skeleton,
  Space,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskDrawer } from '@/components/TaskDrawer';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import {
  PRIORITIES,
  STATUSES,
  type Label,
  type Project,
  type Task,
  type User,
} from '@/lib/types';

export default function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [priority, setPriority] = useState<string | undefined>();
  const [assigneeId, setAssigneeId] = useState<string | undefined>();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const members: User[] = useMemo(
    () => project?.workspace?.members?.map((m) => m.user).filter(Boolean) ?? [],
    [project],
  );
  const labels: Label[] = project?.labels ?? [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ projectId, pageSize: '100' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (assigneeId) params.set('assigneeId', assigneeId);

      const [p, list] = await Promise.all([
        api<Project>(`/projects/${projectId}`),
        api<{ items: Task[] }>(`/tasks?${params.toString()}`),
      ]);
      setProject(p);
      setTasks(list.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [projectId, search, status, priority, assigneeId]);

  useEffect(() => {
    if (!localStorage.getItem('tf_token')) {
      router.replace('/login');
      return;
    }
    void load();
    const socket = getSocket();
    socket?.emit('project.subscribe', { projectId });
    const refresh = () => void load();
    socket?.on('task.created', refresh);
    socket?.on('task.updated', refresh);
    socket?.on('task.deleted', refresh);
    socket?.on('task.comment', refresh);
    return () => {
      socket?.off('task.created', refresh);
      socket?.off('task.updated', refresh);
      socket?.off('task.deleted', refresh);
      socket?.off('task.comment', refresh);
    };
  }, [load, projectId, router]);

  async function createTask() {
    if (!title.trim()) return;
    setAdding(true);
    try {
      await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), projectId }),
      });
      setTitle('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add task');
    } finally {
      setAdding(false);
    }
  }

  async function onMove(taskId: string, nextStatus: string, position: number) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: nextStatus, position } : t,
      ),
    );
    try {
      await api(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, position }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed');
      await load();
    }
  }

  const filters = (
    <Space wrap size={[8, 8]} style={{ width: '100%' }}>
      <Input.Search
        placeholder="Search tasks"
        allowClear
        style={{ width: isMobile ? '100%' : 220 }}
        onSearch={setSearch}
        enterButton
      />
      <Select
        allowClear
        placeholder="Status"
        style={{ width: isMobile ? '100%' : 140 }}
        options={[...STATUSES]}
        value={status}
        onChange={setStatus}
      />
      <Select
        allowClear
        placeholder="Priority"
        style={{ width: isMobile ? '100%' : 140 }}
        options={[...PRIORITIES]}
        value={priority}
        onChange={setPriority}
      />
      <Select
        allowClear
        placeholder="Assignee"
        style={{ width: isMobile ? '100%' : 180 }}
        options={members.map((m) => ({ value: m.id, label: m.name }))}
        value={assigneeId}
        onChange={setAssigneeId}
      />
    </Space>
  );

  return (
    <AppShell
      title={project?.name ?? 'Board'}
      extra={
        <Link href="/projects">
          <Button>All projects</Button>
        </Link>
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

      {isMobile ? (
        <Collapse
          style={{ marginBottom: 12 }}
          items={[{ key: 'filters', label: 'Filters & search', children: filters }]}
        />
      ) : (
        <Card size="small" style={{ marginBottom: 12 }}>
          {filters}
        </Card>
      )}

      <Card size="small" style={{ marginBottom: 12 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Add a task…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onPressEnter={() => void createTask()}
            aria-label="New task title"
          />
          <Button type="primary" loading={adding} onClick={() => void createTask()}>
            Add
          </Button>
        </Space.Compact>
      </Card>

      {loading && !tasks.length ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : !tasks.length ? (
        <Card>
          <Empty
            description="No tasks match these filters"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Typography.Text type="secondary">
              Add a task above, or clear filters
            </Typography.Text>
          </Empty>
        </Card>
      ) : (
        <KanbanBoard
          tasks={tasks}
          onMove={onMove}
          onOpen={(id) => {
            setOpenTaskId(id);
            setDrawerOpen(true);
          }}
        />
      )}

      <TaskDrawer
        open={drawerOpen}
        taskId={openTaskId}
        projectId={projectId}
        members={members}
        labels={labels}
        onClose={() => {
          setDrawerOpen(false);
          setOpenTaskId(null);
        }}
        onChanged={() => void load()}
      />
    </AppShell>
  );
}
