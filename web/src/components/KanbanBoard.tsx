'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { STATUSES, type Task } from '@/lib/types';

const priorityColor: Record<string, string> = {
  LOW: 'default',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

function TaskCardItem({
  task,
  onOpen,
}: {
  task: Task;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { status: task.status } });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <Card
        size="small"
        hoverable
        styles={{ body: { padding: 12 } }}
        title={
          <span {...attributes} {...listeners} style={{ cursor: 'grab', userSelect: 'none' }}>
            ⋮⋮ {task.title}
          </span>
        }
        onClick={() => onOpen(task.id)}
      >
        <Space size={4} wrap>
          <Tag color={priorityColor[task.priority]}>{task.priority}</Tag>
          {task.assignee ? (
            <Typography.Text type="secondary">{task.assignee.name}</Typography.Text>
          ) : null}
          {task.dueDate ? (
            <Tag>{new Date(task.dueDate).toLocaleDateString()}</Tag>
          ) : null}
          {task.labels?.map((l) => (
            <Tag key={l.label.id} color={l.label.color}>
              {l.label.name}
            </Tag>
          ))}
        </Space>
      </Card>
    </div>
  );
}

function Column({
  id,
  title,
  tasks,
  onOpen,
}: {
  id: string;
  title: string;
  tasks: Task[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} style={{ minWidth: 260, flex: '1 0 260px' }}>
      <Card
        size="small"
        title={
          <Space>
            {title}
            <Tag>{tasks.length}</Tag>
          </Space>
        }
        styles={{
          body: {
            minHeight: 420,
            background: isOver ? '#e6f4ff' : '#fafafa',
          },
        }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {tasks.map((t) => (
              <TaskCardItem key={t.id} task={t} onOpen={onOpen} />
            ))}
          </Space>
        </SortableContext>
      </Card>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  onMove,
  onOpen,
}: {
  tasks: Task[];
  onMove: (taskId: string, status: string, position: number) => Promise<void>;
  onOpen: (taskId: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const s of STATUSES) map[s.value] = [];
    for (const t of tasks) {
      (map[t.status] ?? map.TODO).push(t);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [tasks]);

  const active = tasks.find((t) => t.id === activeId) ?? null;

  async function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let newStatus = task.status;
    const overId = String(over.id);
    if (STATUSES.some((s) => s.value === overId)) {
      newStatus = overId;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    const siblings = tasks.filter((t) => t.status === newStatus && t.id !== taskId);
    const position = siblings.length;
    if (newStatus === task.status && task.position === position) return;
    await onMove(taskId, newStatus, position);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={(e) => void onDragEnd(e)}
    >
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
        {STATUSES.map((col) => (
          <Column
            key={col.value}
            id={col.value}
            title={col.label}
            tasks={byStatus[col.value] ?? []}
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay>
        {active ? (
          <Card size="small" style={{ width: 240 }}>
            <Typography.Text strong>{active.title}</Typography.Text>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
