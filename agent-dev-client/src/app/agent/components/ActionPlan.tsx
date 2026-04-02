import React from 'react';
import { registerComponent } from '@/app/lib/components/registry';
import type { AsArgumentsProps, ComponentConfigT } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/agent/shadcdn/card';
import { Badge } from '@/app/agent/shadcdn/badge';
import {
  Target,
  AlertTriangle,
  HelpCircle,
  Lock,
  User,
  Bot,
  Zap,
  ArrowRight,
} from 'lucide-react';

const config: ComponentConfigT = {
  componentName: 'ActionPlan',
  type: 'component',
  isStreaming: true,
  name: 'ActionPlan',
  description:
    'Displays a structured action plan with status header, 3-7 prioritized actions with owners and difficulty, and any flags (risks, unknowns, blockers). Use this to present "where we are" status and "next 3-7 actions" at each turn.',
  isStrictSchema: true,
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description: 'Brief "where we are" status summary (1-2 sentences)',
      },
      stage: {
        type: 'string',
        description: 'Current stage label, e.g., "Concept", "Discovery", "MVP Build"',
      },
      actions: {
        type: 'array',
        description: 'List of 3-7 next actions',
        items: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'What needs to be done',
            },
            owner: {
              type: 'string',
              description:
                'Who is responsible: "You", "Product Agent", "Architecture Agent", "AI/ML Agent", "Engineering Agent", "Learning Agent", "Dev Workflow Agent"',
            },
            difficulty: {
              type: 'string',
              description: 'Rough difficulty: S (hours), M (1-2 days), L (3-5 days)',
              enum: ['S', 'M', 'L'],
            },
            dependencies: {
              type: 'string',
              description: 'What this depends on (optional)',
            },
          },
          required: ['description', 'owner', 'difficulty'],
          additionalProperties: false,
        },
      },
      flags: {
        type: 'array',
        description: 'Risks, unknowns, or blockers (optional)',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Flag type: risk, unknown, or blocker',
              enum: ['risk', 'unknown', 'blocker'],
            },
            description: {
              type: 'string',
              description: 'Description of the flag',
            },
          },
          required: ['type', 'description'],
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
    required: ['status', 'stage', 'actions'],
  },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  S: 'bg-success/20 text-success border-success/30',
  M: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  L: 'bg-destructive/20 text-destructive border-destructive/30',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  S: 'Small (hours)',
  M: 'Medium (1-2d)',
  L: 'Large (3-5d)',
};

const OWNER_ICON: Record<string, React.ElementType> = {
  You: User,
};

const FLAG_STYLES: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  risk: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  unknown: { icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  blocker: { icon: Lock, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
};

type Action = {
  description: string;
  owner: string;
  difficulty: string;
  dependencies?: string;
};

type Flag = {
  type: 'risk' | 'unknown' | 'blocker';
  description: string;
};

type ActionPlanProps = {
  status: string;
  stage: string;
  actions: Action[];
  flags?: Flag[];
};

const ActionPlanComponent: React.FC<AsArgumentsProps<ActionPlanProps>> = ({ argumentsProps }) => {
  const { status, stage, actions = [], flags = [] } = argumentsProps;

  return (
    <Card className="w-full max-w-2xl mx-auto border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-foreground text-lg">Action Plan</CardTitle>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{stage}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{status}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Actions */}
        <div className="space-y-2 mb-4">
          {actions.map((action, idx) => {
            const OwnerIcon = OWNER_ICON[action.owner] || Bot;
            const isFounder = action.owner === 'You';

            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-border/50 transition-colors"
              >
                {/* Number */}
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{action.description}</p>
                  {action.dependencies && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-muted-foreground/60">Depends on:</span> {action.dependencies}
                    </p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${isFounder ? 'border-amber-500/30 text-amber-400' : 'border-primary/30 text-primary'}`}
                  >
                    <OwnerIcon className="w-2.5 h-2.5 mr-1" />
                    {action.owner}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${DIFFICULTY_COLORS[action.difficulty] || ''}`}>
                    {action.difficulty}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Flags */}
        {flags && flags.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-border/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Flags & Risks
            </p>
            {flags.map((flag, idx) => {
              const style = FLAG_STYLES[flag.type] || FLAG_STYLES.risk;
              const FlagIcon = style.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-2.5 rounded-lg border ${style.bg}`}
                >
                  <FlagIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${style.color}`} />
                  <div>
                    <Badge variant="outline" className={`text-[10px] px-1 py-0 mb-1 ${style.color} border-current/30`}>
                      {flag.type}
                    </Badge>
                    <p className="text-xs text-foreground/80">{flag.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default registerComponent(config)(function ActionPlan(
  props: AsArgumentsProps<ActionPlanProps>,
) {
  return <ActionPlanComponent {...props} />;
});
