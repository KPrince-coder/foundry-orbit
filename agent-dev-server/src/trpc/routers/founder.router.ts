import { z } from 'zod';
import { createRouter, publicProcedure } from '../init';
import { loggedProcedure } from '../middleware/action-logging';

const founderProfileSchema = z.object({
  idea: z.string(),
  userAndProblem: z.string(),
  currentStage: z.string(),
  skills: z.array(z.string()),
  timeHorizon: z.string(),
  teamSize: z.string().optional(),
  budget: z.string().optional(),
  domain: z.string().optional(),
  goalType: z.string().optional(),
  repoUrl: z.string().optional(),
  notionUrl: z.string().optional(),
});

export type FounderProfile = z.infer<typeof founderProfileSchema> & {
  id: string;
  createdAt: number;
  updatedAt: number;
};

const STORAGE_PATH = 'data/founder/profile.json';

export const founderRouter = createRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    try {
      const raw = await ctx.storage.readFile(STORAGE_PATH);
      return JSON.parse(raw.toString()) as FounderProfile;
    } catch {
      return null;
    }
  }),

  save: loggedProcedure
    .input(founderProfileSchema)
    .mutation(async ({ input, ctx }) => {
      console.log('[FounderRouter] Saving profile:', input.idea.substring(0, 50));
      try {
        let existing: FounderProfile | null = null;
        try {
          const raw = await ctx.storage.readFile(STORAGE_PATH);
          existing = JSON.parse(raw.toString());
        } catch {
          // No existing profile
        }

        const profile: FounderProfile = {
          id: existing?.id ?? crypto.randomUUID(),
          ...input,
          createdAt: existing?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        };

        await ctx.storage.writeFile(STORAGE_PATH, Buffer.from(JSON.stringify(profile)));
        console.log('[FounderRouter] Profile saved:', profile.id);

        return {
          ...profile,
          logSummary: `Saved founder profile — stage: ${input.currentStage}, domain: ${input.domain || 'unset'}`,
        };
      } catch (error) {
        console.error('[FounderRouter] Error saving profile:', error);
        throw error;
      }
    }),

  updateStage: loggedProcedure
    .input(z.object({ stage: z.string() }))
    .mutation(async ({ input, ctx }) => {
      console.log('[FounderRouter] Updating stage to:', input.stage);
      try {
        const raw = await ctx.storage.readFile(STORAGE_PATH);
        const profile = JSON.parse(raw.toString()) as FounderProfile;
        profile.currentStage = input.stage;
        profile.updatedAt = Date.now();
        await ctx.storage.writeFile(STORAGE_PATH, Buffer.from(JSON.stringify(profile)));

        return {
          stage: input.stage,
          logSummary: `Stage updated to: ${input.stage}`,
          invalidateTopics: ['founder', 'roadmap'],
        };
      } catch (error) {
        console.error('[FounderRouter] Error updating stage:', error);
        throw error;
      }
    }),
});
