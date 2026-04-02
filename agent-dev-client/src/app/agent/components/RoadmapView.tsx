import React from 'react';
import { registerComponent } from '@/app/lib/components/registry';
import type { AsArgumentsProps, ComponentConfigT } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/agent/shadcdn/card';
import { Badge } from '@/app/agent/shadcdn/badge';
import {
  Lightbulb,
  Search,
  FileText,
  Compass,
  Hammer,
  Rocket,
  CheckCircle2,
  Circle,
  ArrowRight,
} from 'lucide-react';

const config: ComponentConfigT = {
  componentName: 'RoadmapView',
  type: 'component',
  isStreaming: true,
  name: 'RoadmapView',
  description:
    'Visual stage-based roadmap showing the startup journey from Concept to Launch. Displays the current stage, completed stages, and milestones with their status. Use after intake to show the founder where they are and what lies ahead.',
  isStrictSchema: true,
  parameters: {
    type: 'object',
    properties: {
      currentStage: {
        type: 'string',
        description:
          'The current stage the founder is in. One of: concept, discovery, mvp_definition, architecture, build, launch_prep',
        enum: ['concept', 'discovery', 'mvp_definition', 'architecture', 'build', 'launch_prep'],
      },
      milestones: {
        type: 'array',
        description: 'List of milestones for each stage',
        items: {
          type: 'object',
          properties: {
            stage: {
              type: 'string',
              description: 'Which stage this milestone belongs to',
            },
            title: {
              type: 'string',
              description: 'Milestone title',
            },
            status: {
              type: 'string',
              description: 'Status: done, in_progress, or upcoming',
              enum: ['done', 'in_progress', 'upcoming'],
            },
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

type Milestone = {
  stage: string;
  title: string;
  status: 'done' | 'in_progress' | 'upcoming';
};

type RoadmapViewProps = {
  currentStage: string;
  milestones: Milestone[];
};

const RoadmapViewComponent: React.FC<AsArgumentsProps<RoadmapViewProps>> = ({ argumentsProps }) => {
  const { currentStage, milestones = [] } = argumentsProps;
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

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
        {/* Stage timeline */}
        <div className="space-y-1 mb-6">
          {STAGE_ORDER.map((stageId, idx) => {
            const meta = STAGE_META[stageId];
            const Icon = meta.icon;
            const isComplete = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isLast = idx === STAGE_ORDER.length - 1;
            const stageMilestones = milestones.filter((m) => m.stage === stageId);

            return (
              <div key={stageId}>
                <div className="flex items-start gap-3">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center w-8 flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors border ${
                        isComplete
                          ? 'bg-primary/20 border-primary/40'
                          : isCurrent
                            ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
                            : 'bg-muted/30 border-border/50'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Icon
                          className={`w-4 h-4 ${isCurrent ? meta.color : 'text-muted-foreground/60'}`}
                        />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 min-h-[16px] ${
                          isComplete ? 'bg-primary/40' : 'bg-border/40'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-3 ${!isCurrent && !isComplete ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-semibold ${
                          isCurrent ? 'text-foreground' : isComplete ? 'text-foreground/80' : 'text-muted-foreground'
                        }`}
                      >
                        {meta.label}
                      </p>
                      {isCurrent && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                          Current
                        </Badge>
                      )}
                      {isComplete && (
                        <Badge className="bg-success/20 text-success border-success/30 text-[10px] px-1.5 py-0">
                          Done
                        </Badge>
                      )}
                    </div>
                    {/* Milestones for this stage */}
                    {(isCurrent || isComplete) && stageMilestones.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {stageMilestones.map((m, mi) => (
                          <div key={mi} className="flex items-center gap-2 text-xs">
                            {m.status === 'done' ? (
                              <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />
                            ) : m.status === 'in_progress' ? (
                              <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                            ) : (
                              <Circle className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                            )}
                            <span
                              className={
                                m.status === 'done'
                                  ? 'text-muted-foreground line-through'
                                  : m.status === 'in_progress'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                              }
                            >
                              {m.title}
                            </span>
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
      </CardContent>
    </Card>
  );
};

export default registerComponent(config)(function RoadmapView(
  props: AsArgumentsProps<RoadmapViewProps>,
) {
  return <RoadmapViewComponent {...props} />;
});
