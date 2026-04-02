import React, { useMemo } from 'react';
import { registerComponent } from '@/app/lib/components/registry';
import type { AsArgumentsProps, ComponentConfigT } from '@/app/lib/types';
import { trpc } from '@/app/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/agent/shadcdn/card';
import { Badge } from '@/app/agent/shadcdn/badge';
import {
  LayoutGrid, ArrowRight, Clock, User, Bot, Link2, CheckCircle2, Circle, AlertOctagon, Play,
} from 'lucide-react';

const config: ComponentConfigT = {
  componentName: 'TaskBoard',
  type: 'component',
  isStreaming: true,
  name: 'TaskBoard',
  description:
    'Interactive sprint-style task board with three columns: "Now" (next 3-5 days), "Next" (following block), and "Done". Tasks can be clicked to advance their status (todo → in_progress → done). Supports blocked state. Reads persisted tasks from tRPC when available, falls back to orchestrator props.',
  isStrictSchema: true,
  parameters: {
    type: 'object',
    properties: {
      sprintName: {
        type: 'string',
        description: 'Name/label for this sprint or planning period',
      },
      now: {
        type: 'array',
        description: 'Tasks for the next 3-5 days (NOW column)',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Task title — action-oriented' },
            owner: { type: 'string', description: 'Who does this' },
            difficulty: { type: 'string', enum: ['S', 'M', 'L'], description: 'S = hours, M = 1-2 days, L = 3-5 days' },
            notes: { type: 'string', description: 'Optional notes' },
            dependencies: { type: 'string', description: 'Optional dependencies' },
          },
          required: ['title', 'owner', 'difficulty'],
          additionalProperties: false,
        },
      },
      next: {
        type: 'array',
        description: 'Tasks for the following block (NEXT column)',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            owner: { type: 'string' },
            difficulty: { type: 'string', enum: ['S', 'M', 'L'] },
            notes: { type: 'string' },
            dependencies: { type: 'string' },
          },
          required: ['title', 'owner', 'difficulty'],
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
    required: ['sprintName', 'now', 'next'],
  },
};

const DIFFICULTY_STYLES: Record<string, { label: string; className: string }> = {
  S: { label: 'S', className: 'bg-success/20 text-success border-success/30' },
  M: { label: 'M', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  L: { label: 'L', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

const STATUS_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  todo: { icon: Circle, color: 'text-muted-foreground/50' },
  in_progress: { icon: Play, color: 'text-primary' },
  done: { icon: CheckCircle2, color: 'text-success' },
  blocked: { icon: AlertOctagon, color: 'text-destructive' },
};

const NEXT_STATUS: Record<string, string> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
  blocked: 'todo',
};

type Task = {
  id?: string;
  title: string;
  owner: string;
  difficulty: string;
  notes?: string;
  dependencies?: string;
  status?: string;
};

type TaskBoardProps = {
  sprintName: string;
  now: Task[];
  next: Task[];
};

const TaskCard: React.FC<{
  task: Task;
  index: number;
  onStatusChange?: (id: string, status: string) => void;
}> = ({ task, index, onStatusChange }) => {
  const isFounder = task.owner === 'You';
  const OwnerIcon = isFounder ? User : Bot;
  const diff = DIFFICULTY_STYLES[task.difficulty] || DIFFICULTY_STYLES.M;
  const status = task.status || 'todo';
  const { icon: StatusIcon, color: statusColor } = STATUS_ICONS[status] || STATUS_ICONS.todo;

  const handleClick = () => {
    if (task.id && onStatusChange) {
      onStatusChange(task.id, NEXT_STATUS[status] || 'todo');
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border transition-colors group ${
        status === 'done'
          ? 'bg-success/5 border-success/20 opacity-70'
          : status === 'blocked'
            ? 'bg-destructive/5 border-destructive/20'
            : 'bg-muted/20 border-border/30 hover:border-border/50'
      } cursor-pointer`}
      onClick={handleClick}
      title={`Click to change status (${status} → ${NEXT_STATUS[status]})`}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-0.5">
          <StatusIcon className={`w-4 h-4 ${statusColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </p>
          {task.notes && <p className="text-xs text-muted-foreground mt-1">{task.notes}</p>}
          {task.dependencies && (
            <div className="flex items-center gap-1 mt-1.5">
              <Link2 className="w-3 h-3 text-muted-foreground/60" />
              <p className="text-[10px] text-muted-foreground/80">Depends: {task.dependencies}</p>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline"
              className={`text-[10px] px-1.5 py-0 ${isFounder ? 'border-amber-500/30 text-amber-400' : 'border-primary/30 text-primary'}`}>
              <OwnerIcon className="w-2.5 h-2.5 mr-1" />{task.owner}
            </Badge>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${diff.className}`}>{diff.label}</Badge>
            {status === 'blocked' && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/30">Blocked</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskBoardComponent: React.FC<AsArgumentsProps<TaskBoardProps>> = ({ argumentsProps }) => {
  const { sprintName, now = [], next = [] } = argumentsProps;

  // Pure props-driven — orchestrator provides the data, tRPC handles persistence
  const tasks = useMemo(() => ({
    now: now.map((t, i) => ({ ...t, id: t.id || `now-${i}`, status: t.status || 'todo' })),
    next: next.map((t, i) => ({ ...t, id: t.id || `next-${i}`, status: t.status || 'todo' })),
    done: [] as Task[],
  }), []);

  // Status toggle via tRPC mutation (fire-and-forget)
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await trpc.tasks.updateStatus.mutate({ id, status: newStatus as any });
    } catch (err) {
      console.error('[TaskBoard] Error updating status:', err);
    }
  };

  const totalTasks = tasks.now.length + tasks.next.length + tasks.done.length;

  return (
    <Card className="w-full max-w-2xl mx-auto border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-foreground text-lg">{sprintName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalTasks} tasks{tasks.done.length > 0 ? ` — ${tasks.done.length} done` : ''}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* NOW */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Now</span>
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 text-muted-foreground border-border/50">{tasks.now.length}</Badge>
            </div>
            <div className="space-y-2">
              {tasks.now.map((task, idx) => (
                <TaskCard key={task.id || idx} task={task} index={idx} onStatusChange={handleStatusChange} />
              ))}
              {tasks.now.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>}
            </div>
          </div>

          {/* NEXT */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Next</span>
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 text-muted-foreground border-border/50">{tasks.next.length}</Badge>
            </div>
            <div className="space-y-2">
              {tasks.next.map((task, idx) => (
                <TaskCard key={task.id || idx} task={task} index={idx} onStatusChange={handleStatusChange} />
              ))}
              {tasks.next.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>}
            </div>
          </div>

          {/* DONE */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Done</span>
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 text-success/70 border-success/30">{tasks.done.length}</Badge>
            </div>
            <div className="space-y-2">
              {tasks.done.map((task, idx) => (
                <TaskCard key={task.id || idx} task={task} index={idx} onStatusChange={handleStatusChange} />
              ))}
              {tasks.done.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Complete tasks will appear here</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground">Difficulty:</span>
          {Object.entries(DIFFICULTY_STYLES).map(([key, val]) => (
            <Badge key={key} variant="outline" className={`text-[10px] px-1.5 py-0 ${val.className}`}>
              {key === 'S' ? 'S = hours' : key === 'M' ? 'M = 1-2d' : 'L = 3-5d'}
            </Badge>
          ))}
          {false && (
            <span className="text-[10px] text-muted-foreground ml-auto">Click tasks to update status</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default registerComponent(config)(function TaskBoard(
  props: AsArgumentsProps<TaskBoardProps>,
) {
  return <TaskBoardComponent {...props} />;
});
