import { z } from 'zod';
import { createRouter, publicProcedure } from '../init';
import { loggedProcedure } from '../middleware/action-logging';

const milestoneSchema = z.object({
  id: z.string(),
  stage: z.string(),
  title: z.string(),
  status: z.enum(['done', 'in_progress', 'upcoming']),
  targetWeek: z.string().optional(),
  notes: z.string().optional(),
});

export type Milestone = z.infer<typeof milestoneSchema>;

export type RoadmapData = {
  currentStage: string;
  milestones: Milestone[];
  updatedAt: number;
};

const STORAGE_PATH = 'data/roadmap/roadmap.json';

export const roadmapRouter = createRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    try {
      const raw = await ctx.storage.readFile(STORAGE_PATH);
      return JSON.parse(raw.toString()) as RoadmapData;
    } catch {
      return null;
    }
  }),

  save: loggedProcedure
    .input(z.object({
      currentStage: z.string(),
      milestones: z.array(milestoneSchema),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('[RoadmapRouter] Saving roadmap, stage:', input.currentStage);
      try {
        const data: RoadmapData = {
          currentStage: input.currentStage,
          milestones: input.milestones,
          updatedAt: Date.now(),
        };
        await ctx.storage.writeFile(STORAGE_PATH, Buffer.from(JSON.stringify(data)));
        console.log('[RoadmapRouter] Roadmap saved with', input.milestones.length, 'milestones');

        return {
          ...data,
          logSummary: `Roadmap saved — stage: ${input.currentStage}, ${input.milestones.length} milestones`,
          invalidateTopics: ['roadmap', 'founder'],
        };
      } catch (error) {
        console.error('[RoadmapRouter] Error saving roadmap:', error);
        throw error;
      }
    }),

  updateMilestone: loggedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['done', 'in_progress', 'upcoming']),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('[RoadmapRouter] Updating milestone:', input.id, '→', input.status);
      try {
        const raw = await ctx.storage.readFile(STORAGE_PATH);
        const data = JSON.parse(raw.toString()) as RoadmapData;
        const milestone = data.milestones.find(m => m.id === input.id);
        if (!milestone) {
          throw new Error(`Milestone ${input.id} not found`);
        }
        milestone.status = input.status;
        data.updatedAt = Date.now();
        await ctx.storage.writeFile(STORAGE_PATH, Buffer.from(JSON.stringify(data)));

        return {
          id: input.id,
          status: input.status,
          logSummary: `Milestone "${milestone.title}" → ${input.status}`,
        };
      } catch (error) {
        console.error('[RoadmapRouter] Error updating milestone:', error);
        throw error;
      }
    }),
});
