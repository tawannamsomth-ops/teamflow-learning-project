'use client';

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState } from 'react';

export type TaskCard = {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee?: { name: string } | null;
  position: number;
};

const COLUMNS = [
  { id: 'BACKLOG', title: 'Backlog' },
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'DONE', title: 'Done' },
] as const;

const priorityColor: Record<string, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#38bdf8',
  HIGH: '#f59e0b',
  URGENT: '#ef4444',
};

function TaskItem({ task }: { task: TaskCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { status: task.status } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="kanban-card"
    >
      <div className="kanban-card-title">{task.title}</div>
      <div className="kanban-card-meta">
        <span
          className="priority-dot"
          style={{ background: priorityColor[task.priority] ?? '#94a3b8' }}
        />
        <span>{task.priority}</span>
        {task.assignee ? <span>· {task.assignee.name}</span> : null}
      </div>
    </div>
  );
}

function Column({
  id,
  title,
  tasks,
}: {
  id: string;
  title: string;
  tasks: TaskCard[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className={`kanban-column ${isOver ? 'over' : ''}`} ref={setNodeRef}>
      <div className="kanban-column-head">
        <h3>{title}</h3>
        <span>{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-column-body">
          {tasks.map((t) => (
            <TaskItem key={t.id} task={t} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  onMove,
}: {
  tasks: TaskCard[];
  onMove: (taskId: string, status: string, position: number) => Promise<void>;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const map: Record<string, TaskCard[]> = {};
    for (const col of COLUMNS) map[col.id] = [];
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
    if (COLUMNS.some((c) => c.id === overId)) {
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
      onDragEnd={onDragEnd}
    >
      <div className="kanban">
        {COLUMNS.map((col) => (
          <Column key={col.id} id={col.id} title={col.title} tasks={byStatus[col.id] ?? []} />
        ))}
      </div>
      <DragOverlay>
        {active ? (
          <div className="kanban-card dragging">
            <div className="kanban-card-title">{active.title}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
