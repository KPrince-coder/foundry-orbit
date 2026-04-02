import { createRouter } from './init';
import type { createPlatformRouter } from './routers/platform.router';
import { founderRouter } from './routers/founder.router';
import { roadmapRouter } from './routers/roadmap.router';
import { tasksRouter } from './routers/tasks.router';

export function createAppRouter(platformRouter: ReturnType<typeof createPlatformRouter>) {
  return createRouter({
    platform: platformRouter,
    founder: founderRouter,
    roadmap: roadmapRouter,
    tasks: tasksRouter,
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
