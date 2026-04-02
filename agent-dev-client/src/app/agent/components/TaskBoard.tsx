import React from 'react';
import { registerComponent } from '@/app/lib/components/registry';
import type { AsArgumentsProps, ComponentConfigT } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/agent/shadcdn/card';
import { Badge } from '@/app/agent/shadcdn/badge';
import {
  LayoutGrid,
  ArrowRight,
  Clock,
  User,
  Bot,
  Link2,
} from 'lucide-react';

const config: ComponentConfigT = {
  componentName: 'TaskBoard',
  type: 'component',
  isStreaming: true,
  name: 'TaskBoard',
  description:
    'Sprint-style task board with two columns: "Now" (next 3-5 days) and "Next" (following block). Each task shows title, owner, difficulty, and optional dependencies. Use when presenting a delivery plan or sprint breakdown.',
  isStrictSchema: true,
  parameters: {
    type: 'object',
    properties: {
      sprintName: {
        type: 'string',
        description: 'Name/label for this sprint or planning period, e.g., "Sprint 1 — Foundation"',
      },
      now: {
        type: 'array',
        description: 'Tasks for the next 3-5 days (NOW column)',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Task title — action-oriented (verb + noun)',
            },
            owner: {
              type: 'string',
              description: 'Who does this: "You" or an agent name',
            },
            difficulty: {
              type: 'string',
              description: 'S = hours, M = 1-2 days, L = 3-5 days',
              enum: ['S', 'M', 'L'],
            },
            notes: {
              type: 'string',
              description: 'Optional notes or context',
            },
            dependencies: {
              type: 'string',
              description: 'Optional: what must be done first',
            },
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
            title: {
              type: 'string',
              description: 'Task title',
            },
            owner: {
              type: 'string',
              description: 'Who does this',
            },
            difficulty: {
              type: 'string',
              description: 'S, M, or L',
              enum: ['S', 'M', 'L'],
            },
            notes: {
              type: 'string',
              description: 'Optional notes',
            },
            dependencies: {
              type: 'string',
              description: 'Optional dependencies',
            },
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

type Task = {
  title: string;
  owner: string;
  difficulty: string;
  notes?: string;
  dependencies?: string;
};

type TaskBoardProps = {
  sprintName: string;
  now: Task[];
  next: Task[];
};

const TaskCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => {
  const isFounder = task.owner === 'You';
  const OwnerIcon = isFounder ? User : Bot;
  const diff = DIFFICULTY_STYLES[task.difficulty] || DIFFICULTY_STYLES.M;

  return (
    <div className="p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-border/50 transition-colors group">
      <div className="flex items-start gap-2.5">
        <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-primary">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium leading-snug">{task.title}</p>
          {task.notes && (
            <p className="text-xs text-muted-foreground mt-1">{task.notes}</p>
          )}
          {task.dependencies && (
            <div className="flex items-center gap-1 mt-1.5">
              <Link2 className="w-3 h-3 text-muted-foreground/60" />
              <p className="text-[10px] text-muted-foreground/80">Depends: {task.dependencies}</p>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${isFounder ? 'border-amber-500/30 text-amber-400' : 'border-primary/30 text-primary'}`}
            >
              <OwnerIcon className="w-2.5 h-2.5 mr-1" />
              {task.owner}
            </Badge>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${diff.className}`}>
              {diff.label}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskBoardComponent: React.FC<AsArgumentsProps<TaskBoardProps>> = ({ argumentsProps }) => {
  const { sprintName, now = [], next = [] } = argumentsProps;

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
              {now.length + next.length} tasks across 2 phases
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* NOW column */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Now
              </span>
              <span className="text-[10px] text-muted-foreground">(next 3-5 days)</span>
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 text-muted-foreground border-border/50">
                {now.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {now.map((task, idx) => (
                <TaskCard key={idx} task={task} index={idx} />
              ))}
              {now.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No tasks yet</p>
              )}
            </div>
          </div>

          {/* NEXT column */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Next
              </span>
              <span className="text-[10px] text-muted-foreground">(following block)</span>
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 text-muted-foreground border-border/50">
                {next.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {next.map((task, idx) => (
                <TaskCard key={idx} task={task} index={idx} />
              ))}
              {next.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No tasks yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground">Difficulty:</span>
          <div className="flex items-center gap-3">
            {Object.entries(DIFFICULTY_STYLES).map(([key, val]) => (
              <Badge key={key} variant="outline" className={`text-[10px] px-1.5 py-0 ${val.className}`}>
                {key === 'S' ? 'S = hours' : key === 'M' ? 'M = 1-2 days' : 'L = 3-5 days'}
              </Badge>
            ))}
          </div>
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
