'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KanbanBoard, TaskCard } from '@/components/KanbanBoard';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

type Task = TaskCard & {
  description?: string | null;
  labels?: { label: { name: string; color: string } }[];
};

export default function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [project, list] = await Promise.all([
        api<{ name: string }>(`/projects/${projectId}`),
        api<{ items: Task[] }>(
          `/tasks?projectId=${projectId}&pageSize=100${search ? `&search=${encodeURIComponent(search)}` : ''}`,
        ),
      ]);
      setProjectName(project.name);
      setTasks(list.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    }
  }, [projectId, search]);

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
    return () => {
      socket?.off('task.created', refresh);
      socket?.off('task.updated', refresh);
      socket?.off('task.deleted', refresh);
    };
  }, [load, projectId, router]);

  async function createTask(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), projectId }),
      });
      setTitle('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  async function onMove(taskId: string, status: string, position: number) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status, position } : t)),
    );
    try {
      await api(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, position }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed');
      await load();
    }
  }

  return (
    <main className="app-shell board-shell">
      <header className="topbar">
        <div>
          <a className="muted" href="/dashboard">
            ← Dashboard
          </a>
          <h1>{projectName || 'Board'}</h1>
        </div>
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); void load(); }}>
          <input
            placeholder="Search tasks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <form className="inline-form add-task" onSubmit={createTask}>
        <input
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <KanbanBoard tasks={tasks} onMove={onMove} />
    </main>
  );
}
