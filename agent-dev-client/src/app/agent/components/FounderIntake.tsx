import React, { useState, useCallback, useEffect } from 'react';
import { registerComponent } from '@/app/lib/components/registry';
import type { AsArgumentsProps, ComponentConfigT } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/agent/shadcdn/card';
import { Button } from '@/app/agent/shadcdn/button';
import { Textarea } from '@/app/agent/shadcdn/textarea';
import { Input } from '@/app/agent/shadcdn/input';
import { Label } from '@/app/agent/shadcdn/label';
import { Badge } from '@/app/agent/shadcdn/badge';
import {
  Lightbulb,
  Users,
  Layers,
  Code2,
  Clock,
  ChevronRight,
  ChevronLeft,
  Rocket,
  CheckCircle2,
} from 'lucide-react';

const config: ComponentConfigT = {
  componentName: 'FounderIntake',
  type: 'component',
  isStreaming: false,
  name: 'FounderIntake',
  description:
    'Multi-step intake form to gather founder information: idea, target user/problem, current stage, technical skills, and constraints. Use this at the start of a conversation to understand the founder context.',
  isStrictSchema: true,
  parameters: {
    type: 'object',
    properties: {},
    additionalProperties: false,
    required: [],
  },
};

const STAGES = [
  { id: 'idea_only', label: 'Idea only', desc: 'Just thinking about it' },
  { id: 'user_interviews', label: 'Some user interviews', desc: 'Talked to potential users' },
  { id: 'rough_prototype', label: 'Rough prototype', desc: 'Built something basic' },
  { id: 'early_mvp', label: 'Early MVP', desc: 'Functional but minimal' },
  { id: 'launched', label: 'Launched', desc: 'Real users, some traction' },
];

const SKILL_OPTIONS = [
  'Python',
  'JavaScript/TypeScript',
  'Go',
  'Rust',
  'Java',
  'SQL',
  'AWS',
  'GCP',
  'Vercel',
  'Docker',
  'Prompt Engineering',
  'Fine-tuning',
  'Data Pipelines',
  'React/Next.js',
  'Node.js',
  'PostgreSQL',
  'Redis',
  'CI/CD',
];

const STEPS = [
  { icon: Lightbulb, title: 'Your Idea', subtitle: 'Describe what you are building' },
  { icon: Users, title: 'User & Problem', subtitle: 'Who are you solving for?' },
  { icon: Layers, title: 'Current Stage', subtitle: 'Where are you today?' },
  { icon: Code2, title: 'Skills & Stack', subtitle: 'Your technical background' },
  { icon: Clock, title: 'Constraints', subtitle: 'Time, team, and budget' },
];

type FormData = {
  idea: string;
  userProblem: string;
  stage: string;
  skills: string[];
  otherSkills: string;
  timeHorizon: string;
  teamSize: string;
  budget: string;
};

const FounderIntakeComponent: React.FC<AsArgumentsProps<Record<string, never>>> = ({
  handleSendMessage,
}) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    idea: '',
    userProblem: '',
    stage: '',
    skills: [],
    otherSkills: '',
    timeHorizon: '',
    teamSize: '',
    budget: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validateStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    switch (step) {
      case 0:
        if (!form.idea.trim()) newErrors.idea = 'Please describe your idea';
        break;
      case 1:
        if (!form.userProblem.trim()) newErrors.userProblem = 'Please describe the user and problem';
        break;
      case 2:
        if (!form.stage) newErrors.stage = 'Please select your current stage';
        break;
      case 3:
        if (form.skills.length === 0 && !form.otherSkills.trim())
          newErrors.skills = 'Please select at least one skill or describe your stack';
        break;
      case 4:
        if (!form.timeHorizon.trim()) newErrors.timeHorizon = 'Please describe your time horizon';
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [step, form]);

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const toggleSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.skills;
      return next;
    });
  };

  const handleSubmit = () => {
    if (!validateStep()) return;
    setSubmitted(true);

    const allSkills = [...form.skills];
    if (form.otherSkills.trim()) allSkills.push(form.otherSkills.trim());

    handleSendMessage({
      instruction: JSON.stringify({
        action: 'founder_intake_complete',
        idea: form.idea,
        userAndProblem: form.userProblem,
        currentStage: form.stage,
        skills: allSkills,
        timeHorizon: form.timeHorizon,
        teamSize: form.teamSize || 'Not specified',
        budget: form.budget || 'Not specified',
      }),
    });
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <p className="text-lg font-semibold text-foreground">Intake complete</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Analyzing your situation and preparing a personalized roadmap. This will take a moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  const StepIcon = STEPS[step].icon;

  return (
    <Card className="w-full max-w-2xl mx-auto border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-foreground text-lg">Founder Intake</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Tell me about your startup so I can help you build it
            </CardDescription>
          </div>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mt-2">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-center gap-1.5 flex-1">
              <div
                className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${
                  i < step
                    ? 'bg-primary'
                    : i === step
                      ? 'bg-primary/60'
                      : 'bg-muted'
                }`}
              />
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Step header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/30">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <StepIcon className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{STEPS[step].title}</p>
            <p className="text-xs text-muted-foreground">{STEPS[step].subtitle}</p>
          </div>
          <Badge variant="outline" className="ml-auto text-xs text-muted-foreground border-border/50">
            {step + 1} / {STEPS.length}
          </Badge>
        </div>

        {/* Step content */}
        <div className="min-h-[200px]">
          {step === 0 && (
            <div className="space-y-3">
              <Label htmlFor="idea" className="text-foreground text-sm">
                Describe your current idea in 3-5 sentences <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="idea"
                value={form.idea}
                onChange={(e) => {
                  setForm((p) => ({ ...p, idea: e.target.value }));
                  setErrors((p) => { const n = { ...p }; delete n.idea; return n; });
                }}
                placeholder="e.g., I'm building an AI-powered tool that helps small e-commerce businesses automatically write and optimize product descriptions..."
                className="min-h-[140px] bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/60"
                rows={5}
              />
              {errors.idea && <p className="text-xs text-destructive">{errors.idea}</p>}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Label htmlFor="userProblem" className="text-foreground text-sm">
                Who is the primary user, and what painful problem are you solving? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="userProblem"
                value={form.userProblem}
                onChange={(e) => {
                  setForm((p) => ({ ...p, userProblem: e.target.value }));
                  setErrors((p) => { const n = { ...p }; delete n.userProblem; return n; });
                }}
                placeholder="e.g., Small e-commerce store owners who spend 2-3 hours daily writing product descriptions. They lose sales because descriptions are inconsistent and not SEO-optimized..."
                className="min-h-[140px] bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/60"
                rows={5}
              />
              {errors.userProblem && <p className="text-xs text-destructive">{errors.userProblem}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Label className="text-foreground text-sm">
                What is your current stage? <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {STAGES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, stage: s.id }));
                      setErrors((p) => { const n = { ...p }; delete n.stage; return n; });
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                      form.stage === s.id
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border/50 bg-muted/20 text-foreground hover:border-border hover:bg-muted/40'
                    }`}
                  >
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
              {errors.stage && <p className="text-xs text-destructive">{errors.stage}</p>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-foreground text-sm">
                  Select your skills and technologies <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SKILL_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                        form.skills.includes(skill)
                          ? 'bg-primary/20 border-primary/50 text-primary'
                          : 'bg-muted/20 border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="otherSkills" className="text-foreground text-sm">
                  Other skills or experience
                </Label>
                <Input
                  id="otherSkills"
                  value={form.otherSkills}
                  onChange={(e) => setForm((p) => ({ ...p, otherSkills: e.target.value }))}
                  placeholder="e.g., 5 years backend experience, some ML coursework..."
                  className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/60"
                />
              </div>
              {errors.skills && <p className="text-xs text-destructive">{errors.skills}</p>}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="timeHorizon" className="text-foreground text-sm">
                  Time horizon and availability <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="timeHorizon"
                  value={form.timeHorizon}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, timeHorizon: e.target.value }));
                    setErrors((p) => { const n = { ...p }; delete n.timeHorizon; return n; });
                  }}
                  placeholder="e.g., 3 months full-time, or nights and weekends for 6 months"
                  className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/60"
                />
                {errors.timeHorizon && <p className="text-xs text-destructive">{errors.timeHorizon}</p>}
              </div>
              <div>
                <Label htmlFor="teamSize" className="text-foreground text-sm">
                  Team size
                </Label>
                <Input
                  id="teamSize"
                  value={form.teamSize}
                  onChange={(e) => setForm((p) => ({ ...p, teamSize: e.target.value }))}
                  placeholder="e.g., Solo, co-founder who handles business, 2 engineers"
                  className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/60"
                />
              </div>
              <div>
                <Label htmlFor="budget" className="text-foreground text-sm">
                  Budget for infrastructure and tools
                </Label>
                <Input
                  id="budget"
                  value={form.budget}
                  onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
                  placeholder="e.g., Bootstrapped, ~$200/mo for infra; or seed-funded, flexible"
                  className="bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Rocket className="w-4 h-4 mr-1.5" />
              Launch Analysis
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default registerComponent(config)(function FounderIntake(
  props: AsArgumentsProps<Record<string, never>>,
) {
  return <FounderIntakeComponent {...props} />;
});
