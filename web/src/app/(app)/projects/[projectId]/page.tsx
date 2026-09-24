'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  Input,
  Select,
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
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [priority, setPriority] = useState<string | undefined>();
  const [assigneeId, setAssigneeId] = useState<string | undefined>();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const members: User[] = useMemo(
    () =>
      project?.workspace?.members?.map((m) => m.user).filter(Boolean) ?? [],
    [project],
  );
  const labels: Label[] = project?.labels ?? [];

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        projectId,
        pageSize: '100',
      });
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
      setError(err instanceof Error ? err.message : 'Create failed');
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

  return (
    <AppShell
      title={project?.name ?? 'Board'}
      extra={
        <Link href="/dashboard">
          <Button>Back to dashboard</Button>
        </Link>
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

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Input.Search
              placeholder="Search tasks"
              allowClear
              style={{ width: 220 }}
              onSearch={(v) => setSearch(v)}
            />
            <Select
              allowClear
              placeholder="Status"
              style={{ width: 140 }}
              options={[...STATUSES]}
              value={status}
              onChange={setStatus}
            />
            <Select
              allowClear
              placeholder="Priority"
              style={{ width: 140 }}
              options={[...PRIORITIES]}
              value={priority}
              onChange={setPriority}
            />
            <Select
              allowClear
              placeholder="Assignee"
              style={{ width: 180 }}
              options={members.map((m) => ({ value: m.id, label: m.name }))}
              value={assigneeId}
              onChange={setAssigneeId}
            />
          </Space>
          <Typography.Text type="secondary">
            Live board · drag cards · click to edit
          </Typography.Text>
        </Space>
      </Card>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Add a task…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onPressEnter={() => void createTask()}
          />
          <Button type="primary" loading={adding} onClick={() => void createTask()}>
            Add
          </Button>
        </Space.Compact>
      </Card>

      <KanbanBoard
        tasks={tasks}
        onMove={onMove}
        onOpen={(id) => {
          setOpenTaskId(id);
          setDrawerOpen(true);
        }}
      />

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
