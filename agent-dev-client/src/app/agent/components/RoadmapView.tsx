import React from 'react';
// Pure props-driven component — no hooks needed
import { registerComponent } from '@/app/lib/components/registry';
import type { AsArgumentsProps, ComponentConfigT } from '@/app/lib/types';
import { trpc } from '@/app/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/agent/shadcdn/card';
import { Badge } from '@/app/agent/shadcdn/badge';
import {
  Lightbulb, Search, FileText, Compass, Hammer, Rocket,
  CheckCircle2, Circle, ArrowRight, Calendar,
} from 'lucide-react';

const config: ComponentConfigT = {
  componentName: 'RoadmapView',
  type: 'component',
  isStreaming: true,
  name: 'RoadmapView',
  description:
    'Visual stage-based roadmap showing the startup journey from Concept to Launch. Displays all stages with milestones and their status. Reads persisted roadmap from tRPC when available. Milestones support interactive status toggle (click to cycle done/in_progress/upcoming).',
  isStrictSchema: true,
  parameters: {
    type: 'object',
    properties: {
      currentStage: {
        type: 'string',
        description: 'Current stage. One of: concept, discovery, mvp_definition, architecture, build, launch_prep',
        enum: ['concept', 'discovery', 'mvp_definition', 'architecture', 'build', 'launch_prep'],
      },
      milestones: {
        type: 'array',
        description: 'List of milestones for each stage',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique milestone ID' },
            stage: { type: 'string', description: 'Which stage this belongs to' },
            title: { type: 'string', description: 'Milestone title' },
            status: { type: 'string', enum: ['done', 'in_progress', 'upcoming'], description: 'Status' },
            targetWeek: { type: 'string', description: 'Target week e.g. "Week 1"' },
          },
          required: ['stage', 'title', 'status'],
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
    required: ['currentStage', 'milestones'],
  },
};

const STAGE_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  concept: { icon: Lightbulb, label: 'Concept', color: 'text-amber-400' },
  discovery: { icon: Search, label: 'Discovery', color: 'text-blue-400' },
  mvp_definition: { icon: FileText, label: 'MVP Definition', color: 'text-violet-400' },
  architecture: { icon: Compass, label: 'Architecture', color: 'text-cyan-400' },
  build: { icon: Hammer, label: 'Build', color: 'text-emerald-400' },
  launch_prep: { icon: Rocket, label: 'Launch Prep', color: 'text-rose-400' },
};

const STAGE_ORDER = ['concept', 'discovery', 'mvp_definition', 'architecture', 'build', 'launch_prep'];

const NEXT_MILESTONE_STATUS: Record<string, string> = {
  upcoming: 'in_progress',
  in_progress: 'done',
  done: 'upcoming',
};

type Milestone = {
  id?: string;
  stage: string;
  title: string;
  status: 'done' | 'in_progress' | 'upcoming';
  targetWeek?: string;
};

type RoadmapViewProps = {
  currentStage: string;
  milestones: Milestone[];
};

const RoadmapViewComponent: React.FC<AsArgumentsProps<RoadmapViewProps>> = ({ argumentsProps }) => {
  const { currentStage, milestones = [] } = argumentsProps;
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  // Milestone toggle via tRPC mutation (fire-and-forget, no live query needed)
  const handleMilestoneToggle = async (milestone: Milestone) => {
    if (!milestone.id) return;
    const newStatus = NEXT_MILESTONE_STATUS[milestone.status] || 'upcoming';
    try {
      await trpc.roadmap.updateMilestone.mutate({ id: milestone.id, status: newStatus as any });
    } catch (err) {
      console.error('[RoadmapView] Error updating milestone:', err);
    }
  };

  const hasIds = milestones.some(m => !!m.id);

  return (
    <Card className="w-full max-w-2xl mx-auto border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Compass className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-foreground text-lg">Your Startup Roadmap</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Currently in{' '}
              <span className="font-semibold text-primary">
                {STAGE_META[currentStage]?.label || currentStage}
              </span>{' '}
              stage
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1 mb-4">
          {STAGE_ORDER.map((stageId, idx) => {
            const meta = STAGE_META[stageId];
            const Icon = meta.icon;
            const isComplete = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isLast = idx === STAGE_ORDER.length - 1;
            const isFuture = idx > currentIndex;
            const stageMilestones = milestones.filter(m => m.stage === stageId);

            return (
              <div key={stageId}>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center w-8 flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors border ${
                      isComplete ? 'bg-primary/20 border-primary/40'
                        : isCurrent ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
                          : 'bg-muted/30 border-border/50'
                    }`}>
                      {isComplete ? <CheckCircle2 className="w-4 h-4 text-primary" />
                        : <Icon className={`w-4 h-4 ${isCurrent ? meta.color : 'text-muted-foreground/60'}`} />}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 min-h-[16px] ${isComplete ? 'bg-primary/40' : 'bg-border/40'}`} />
                    )}
                  </div>

                  <div className={`flex-1 pb-3 ${isFuture ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${isCurrent ? 'text-foreground' : isComplete ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                        {meta.label}
                      </p>
                      {isCurrent && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">Current</Badge>
                      )}
                      {isComplete && (
                        <Badge className="bg-success/20 text-success border-success/30 text-[10px] px-1.5 py-0">Done</Badge>
                      )}
                    </div>

                    {stageMilestones.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {stageMilestones.map((m, mi) => (
                          <div
                            key={m.id || mi}
                            className={`flex items-center gap-2 text-xs ${hasIds && m.id ? 'cursor-pointer hover:bg-muted/20 rounded px-1 -mx-1 py-0.5' : ''}`}
                            onClick={() => handleMilestoneToggle(m)}
                            title={hasIds && m.id ? 'Click to toggle status' : undefined}
                          >
                            {m.status === 'done' ? (
                              <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />
                            ) : m.status === 'in_progress' ? (
                              <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                            ) : (
                              <Circle className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                            )}
                            <span className={
                              m.status === 'done' ? 'text-muted-foreground line-through'
                                : m.status === 'in_progress' ? 'text-foreground'
                                  : 'text-muted-foreground'
                            }>
                              {m.title}
                            </span>
                            {m.targetWeek && (
                              <span className="text-[10px] text-muted-foreground/60 ml-auto flex items-center gap-0.5">
                                <Calendar className="w-2.5 h-2.5" />{m.targetWeek}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {hasIds && (
          <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
            Click milestones to update their status
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default registerComponent(config)(function RoadmapView(
  props: AsArgumentsProps<RoadmapViewProps>,
) {
  return <RoadmapViewComponent {...props} />;
});
