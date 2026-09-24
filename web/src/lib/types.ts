export type User = { id: string; email: string; name: string };

export type WorkspaceMember = {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: User;
};

export type Workspace = {
  id: string;
  name: string;
  members?: WorkspaceMember[];
  projects?: { id: string; name: string }[];
  _count?: { projects: number };
};

export type Label = { id: string; name: string; color: string };

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  workspaceId: string;
  workspace: { id?: string; name: string; members?: WorkspaceMember[] };
  labels?: Label[];
  _count: { tasks: number };
};

export type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string };
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  position: number;
  projectId: string;
  assigneeId?: string | null;
  assignee?: User | null;
  labels?: { label: Label }[];
  comments?: Comment[];
};

export type Stats = {
  projects: number;
  tasksByStatus: Record<string, number>;
  overdue: number;
  assignedToMe: number;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export const STATUSES = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
] as const;

export const PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
] as const;
