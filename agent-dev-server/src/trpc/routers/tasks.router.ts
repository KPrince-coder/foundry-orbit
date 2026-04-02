import { z } from 'zod';
import { createRouter, publicProcedure } from '../init';
import { loggedProcedure } from '../middleware/action-logging';

const taskStatusEnum = z.enum(['todo', 'in_progress', 'done', 'blocked']);

const taskInputSchema = z.object({
  title: z.string(),
  owner: z.string(),
  difficulty: z.enum(['S', 'M', 'L']),
  phase: z.enum(['now', 'next']),
  notes: z.string().optional(),
  dependencies: z.string().optional(),
  sprintName: z.string().optional(),
});

export type TaskItem = z.infer<typeof taskInputSchema> & {
  id: string;
  status: z.infer<typeof taskStatusEnum>;
  createdAt: number;
  updatedAt: number;
};

export type TasksData = {
  sprintName: string;
  tasks: TaskItem[];
  updatedAt: number;
};

const STORAGE_PATH = 'data/tasks/sprint.json';

async function loadTasks(ctx: { storage: any }): Promise<TasksData> {
  try {
    const raw = await ctx.storage.readFile(STORAGE_PATH);
    return JSON.parse(raw.toString()) as TasksData;
  } catch {
    return { sprintName: 'Sprint 1', tasks: [], updatedAt: Date.now() };
  }
}

async function saveTasks(ctx: { storage: any }, data: TasksData): Promise<void> {
  data.updatedAt = Date.now();
  await ctx.storage.writeFile(STORAGE_PATH, Buffer.from(JSON.stringify(data)));
}

export const tasksRouter = createRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await loadTasks(ctx);
  }),

  saveSprint: loggedProcedure
    .input(z.object({
      sprintName: z.string(),
      tasks: z.array(z.object({
        title: z.string(),
        owner: z.string(),
        difficulty: z.enum(['S', 'M', 'L']),
        phase: z.enum(['now', 'next']),
        notes: z.string().optional(),
        dependencies: z.string().optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('[TasksRouter] Saving sprint:', input.sprintName, 'with', input.tasks.length, 'tasks');
      try {
        const data: TasksData = {
          sprintName: input.sprintName,
          tasks: input.tasks.map(t => ({
            ...t,
            id: crypto.randomUUID(),
            status: 'todo' as const,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })),
          updatedAt: Date.now(),
        };
        await saveTasks(ctx, data);
        console.log('[TasksRouter] Sprint saved:', data.tasks.length, 'tasks');

        return {
          sprintName: data.sprintName,
          taskCount: data.tasks.length,
          logSummary: `Sprint "${input.sprintName}" saved with ${input.tasks.length} tasks`,
        };
      } catch (error) {
        console.error('[TasksRouter] Error saving sprint:', error);
        throw error;
      }
    }),

  updateStatus: loggedProcedure
    .input(z.object({
      id: z.string(),
      status: taskStatusEnum,
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('[TasksRouter] Updating task status:', input.id, '→', input.status);
      try {
        const data = await loadTasks(ctx);
        const task = data.tasks.find(t => t.id === input.id);
        if (!task) throw new Error(`Task ${input.id} not found`);

        task.status = input.status;
        task.updatedAt = Date.now();
        await saveTasks(ctx, data);

        return {
          id: input.id,
          status: input.status,
          logSummary: `Task "${task.title}" → ${input.status}`,
        };
      } catch (error) {
        console.error('[TasksRouter] Error updating status:', error);
        throw error;
      }
    }),

  movePhase: loggedProcedure
    .input(z.object({
      id: z.string(),
      phase: z.enum(['now', 'next']),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('[TasksRouter] Moving task phase:', input.id, '→', input.phase);
      try {
        const data = await loadTasks(ctx);
        const task = data.tasks.find(t => t.id === input.id);
        if (!task) throw new Error(`Task ${input.id} not found`);

        task.phase = input.phase;
        task.updatedAt = Date.now();
        await saveTasks(ctx, data);

        return {
          id: input.id,
          phase: input.phase,
          logSummary: `Task "${task.title}" moved to ${input.phase}`,
        };
      } catch (error) {
        console.error('[TasksRouter] Error moving phase:', error);
        throw error;
      }
    }),
});
