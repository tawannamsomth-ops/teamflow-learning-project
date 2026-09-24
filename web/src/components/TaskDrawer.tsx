'use client';

import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  List,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  PRIORITIES,
  STATUSES,
  type Label,
  type Task,
  type User,
} from '@/lib/types';

type Props = {
  open: boolean;
  taskId: string | null;
  projectId: string;
  members: User[];
  labels: Label[];
  onClose: () => void;
  onChanged: () => void;
};

export function TaskDrawer({
  open,
  taskId,
  projectId,
  members,
  labels,
  onClose,
  onChanged,
}: Props) {
  const [form] = Form.useForm();
  const [task, setTask] = useState<Task | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [labelName, setLabelName] = useState('');

  useEffect(() => {
    if (!open || !taskId) {
      setTask(null);
      return;
    }
    void api<Task>(`/tasks/${taskId}`).then((t) => {
      setTask(t);
      form.setFieldsValue({
        title: t.title,
        description: t.description ?? '',
        status: t.status,
        priority: t.priority,
        assigneeId: t.assigneeId ?? undefined,
        dueDate: t.dueDate ? dayjs(t.dueDate) : undefined,
        labelIds: t.labels?.map((l) => l.label.id) ?? [],
      });
    });
  }, [open, taskId, form]);

  async function save(values: Record<string, unknown>) {
    if (!taskId) return;
    setSaving(true);
    try {
      await api(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: values.title,
          description: values.description || null,
          status: values.status,
          priority: values.priority,
          assigneeId: values.assigneeId ?? null,
          dueDate: values.dueDate
            ? (values.dueDate as dayjs.Dayjs).toISOString()
            : null,
          labelIds: values.labelIds ?? [],
        }),
      });
      message.success('Task saved');
      onChanged();
      const fresh = await api<Task>(`/tasks/${taskId}`);
      setTask(fresh);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function addComment() {
    if (!taskId || !comment.trim()) return;
    await api(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: comment.trim() }),
    });
    setComment('');
    const fresh = await api<Task>(`/tasks/${taskId}`);
    setTask(fresh);
    onChanged();
  }

  async function removeTask() {
    if (!taskId) return;
    await api(`/tasks/${taskId}`, { method: 'DELETE' });
    message.success('Task deleted');
    onClose();
    onChanged();
  }

  async function createLabel() {
    if (!labelName.trim()) return;
    await api(`/projects/${projectId}/labels`, {
      method: 'POST',
      body: JSON.stringify({ name: labelName.trim() }),
    });
    setLabelName('');
    message.success('Label created');
    onChanged();
  }

  return (
    <Drawer
      title="Task details"
      width={480}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Button danger onClick={() => void removeTask()}>
          Delete
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select options={[...STATUSES]} />
        </Form.Item>
        <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
          <Select options={[...PRIORITIES]} />
        </Form.Item>
        <Form.Item name="assigneeId" label="Assignee">
          <Select
            allowClear
            placeholder="Unassigned"
            options={members.map((m) => ({
              value: m.id,
              label: `${m.name} (${m.email})`,
            }))}
          />
        </Form.Item>
        <Form.Item name="dueDate" label="Deadline">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="labelIds" label="Labels">
          <Select
            mode="multiple"
            options={labels.map((l) => ({ value: l.id, label: l.name }))}
          />
        </Form.Item>
        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
          <Input
            placeholder="New label name"
            value={labelName}
            onChange={(e) => setLabelName(e.target.value)}
          />
          <Button onClick={() => void createLabel()}>Add label</Button>
        </Space.Compact>
        <Button type="primary" htmlType="submit" loading={saving} block>
          Save task
        </Button>
      </Form>

      <Typography.Title level={5} style={{ marginTop: 24 }}>
        Comments
      </Typography.Title>
      <List
        size="small"
        dataSource={task?.comments ?? []}
        locale={{ emptyText: 'No comments yet' }}
        renderItem={(c) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space>
                  <Typography.Text strong>{c.author.name}</Typography.Text>
                  <Typography.Text type="secondary">
                    {new Date(c.createdAt).toLocaleString()}
                  </Typography.Text>
                </Space>
              }
              description={c.body}
            />
          </List.Item>
        )}
      />
      <Space.Compact style={{ width: '100%', marginTop: 8 }}>
        <Input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment"
        />
        <Button type="primary" onClick={() => void addComment()}>
          Post
        </Button>
      </Space.Compact>

      {task?.labels?.length ? (
        <div style={{ marginTop: 16 }}>
          {task.labels.map((l) => (
            <Tag key={l.label.id} color={l.label.color}>
              {l.label.name}
            </Tag>
          ))}
        </div>
      ) : null}
    </Drawer>
  );
}
