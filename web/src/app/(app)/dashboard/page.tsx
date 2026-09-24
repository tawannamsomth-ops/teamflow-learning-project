'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearAuth, getStoredUser } from '@/lib/api';

type Stats = {
  projects: number;
  tasksByStatus: Record<string, number>;
  overdue: number;
  assignedToMe: number;
};

type Project = {
  id: string;
  name: string;
  description?: string | null;
  _count: { tasks: number };
  workspace: { name: string };
};

type Workspace = { id: string; name: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(getStoredUser());
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('tf_token')) {
      router.replace('/login');
      return;
    }
    setUser(getStoredUser());
    void load();
  }, [router]);

  async function load() {
    try {
      const [s, p, w] = await Promise.all([
        api<Stats>('/dashboard/stats'),
        api<Project[]>('/projects'),
        api<Workspace[]>('/workspaces'),
      ]);
      setStats(s);
      setProjects(p);
      setWorkspaces(w);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  async function createProject(e: FormEvent) {
    e.preventDefault();
    if (!workspaces[0] || !name.trim()) return;
    try {
      const project = await api<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          workspaceId: workspaces[0].id,
        }),
      });
      setName('');
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  function logout() {
    clearAuth();
    router.replace('/login');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="brand">TeamFlow</p>
          <p className="muted">Hi {user?.name ?? 'there'}</p>
        </div>
        <button className="ghost" onClick={logout} type="button">
          Sign out
        </button>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="stats-row">
        <article>
          <span>Projects</span>
          <strong>{stats?.projects ?? '—'}</strong>
        </article>
        <article>
          <span>Assigned to me</span>
          <strong>{stats?.assignedToMe ?? '—'}</strong>
        </article>
        <article>
          <span>Overdue</span>
          <strong>{stats?.overdue ?? '—'}</strong>
        </article>
        <article>
          <span>In progress</span>
          <strong>{stats?.tasksByStatus?.IN_PROGRESS ?? 0}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Projects</h2>
          <form className="inline-form" onSubmit={createProject}>
            <input
              placeholder="New project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit">Create</button>
          </form>
        </div>
        <ul className="project-list">
          {projects.map((p) => (
            <li key={p.id}>
              <a href={`/projects/${p.id}`}>
                <strong>{p.name}</strong>
                <span>
                  {p.workspace.name} · {p._count.tasks} tasks
                </span>
              </a>
            </li>
          ))}
          {!projects.length ? <li className="muted">No projects yet</li> : null}
        </ul>
      </section>
    </main>
  );
}
