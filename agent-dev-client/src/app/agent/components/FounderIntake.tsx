import React, { useState, useCallback } from 'react';
import { registerComponent } from '@/app/lib/components/registry';
import type { AsArgumentsProps, ComponentConfigT } from '@/app/lib/types';
import { trpc } from '@/app/lib/trpc';
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
  Globe,
  Target,
} from 'lucide-react';

const config: ComponentConfigT = {
  componentName: 'FounderIntake',
  type: 'component',
  isStreaming: false,
  name: 'FounderIntake',
  description:
    'Multi-step intake form to gather founder information: idea, target user/problem, current stage, technical skills, and constraints including domain, goal type, and optional repo/workspace URLs. Use this at the start of a conversation to understand the founder context.',
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

const DOMAINS = [
  { id: 'b2b_saas', label: 'B2B SaaS' },
  { id: 'consumer', label: 'Consumer App' },
  { id: 'dev_tool', label: 'Developer Tool' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'ai_native', label: 'AI-Native Platform' },
  { id: 'other', label: 'Other' },
];

const GOAL_TYPES = [
  { id: 'find_pmf', label: 'Find product-market fit', desc: 'Validate problem and build first users' },
  { id: 'build_foundation', label: 'Build technical foundation', desc: 'Get architecture and infra right' },
  { id: 'launch_fast', label: 'Launch fast', desc: 'Ship MVP as quickly as possible' },
  { id: 'learn_explore', label: 'Learn and explore', desc: 'Understand the space before committing' },
];

const SKILL_OPTIONS = [
  'Python', 'JavaScript/TypeScript', 'Go', 'Rust', 'Java', 'SQL',
  'AWS', 'GCP', 'Vercel', 'Docker', 'Prompt Engineering',
  'Fine-tuning', 'Data Pipelines', 'React/Next.js', 'Node.js',
  'PostgreSQL', 'Redis', 'CI/CD',
];

const STEPS = [
  { icon: Lightbulb, title: 'Your Idea', subtitle: 'Describe what you are building' },
  { icon: Users, title: 'User & Problem', subtitle: 'Who are you solving for?' },
  { icon: Globe, title: 'Domain & Goal', subtitle: 'What kind of product and primary goal' },
  { icon: Layers, title: 'Current Stage', subtitle: 'Where are you today?' },
  { icon: Code2, title: 'Skills & Stack', subtitle: 'Your technical background' },
  { icon: Clock, title: 'Constraints', subtitle: 'Time, team, and budget' },
];

type FormData = {
  idea: string;
  userProblem: string;
  domain: string;
  goalType: string;
  stage: string;
  skills: string[];
  otherSkills: string;
  timeHorizon: string;
  teamSize: string;
  budget: string;
  repoUrl: string;
  notionUrl: string;
};

const FounderIntakeComponent: React.FC<AsArgumentsProps<Record<string, never>>> = ({
  handleSendMessage,
}) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    idea: '', userProblem: '', domain: '', goalType: '', stage: '',
    skills: [], otherSkills: '', timeHorizon: '', teamSize: '',
    budget: '', repoUrl: '', notionUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const clearError = (field: string) => setErrors(p => { const n = { ...p }; delete n[field]; return n; });

  const validateStep = useCallback((): boolean => {
    const e: Record<string, string> = {};
    switch (step) {
      case 0: if (!form.idea.trim()) e.idea = 'Please describe your idea'; break;
      case 1: if (!form.userProblem.trim()) e.userProblem = 'Please describe the user and problem'; break;
      case 2:
        if (!form.domain) e.domain = 'Please select a domain';
        if (!form.goalType) e.goalType = 'Please select your primary goal';
        break;
      case 3: if (!form.stage) e.stage = 'Please select your current stage'; break;
      case 4:
        if (form.skills.length === 0 && !form.otherSkills.trim())
          e.skills = 'Please select at least one skill or describe your stack';
        break;
      case 5: if (!form.timeHorizon.trim()) e.timeHorizon = 'Please describe your time horizon'; break;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [step, form]);

  const handleNext = () => { if (validateStep()) setStep(s => Math.min(s + 1, STEPS.length - 1)); };
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const toggleSkill = (skill: string) => {
    setForm(p => ({
      ...p,
      skills: p.skills.includes(skill) ? p.skills.filter(s => s !== skill) : [...p.skills, skill],
    }));
    clearError('skills');
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitted(true);

    const allSkills = [...form.skills];
    if (form.otherSkills.trim()) allSkills.push(form.otherSkills.trim());

    // Save to tRPC for persistence
    try {
      await trpc.founder.save.mutate({
        idea: form.idea,
        userAndProblem: form.userProblem,
        currentStage: form.stage,
        skills: allSkills,
        timeHorizon: form.timeHorizon,
        teamSize: form.teamSize || undefined,
        budget: form.budget || undefined,
        domain: form.domain || undefined,
        goalType: form.goalType || undefined,
        repoUrl: form.repoUrl || undefined,
        notionUrl: form.notionUrl || undefined,
      });
    } catch (err) {
      console.error('[FounderIntake] Error saving profile:', err);
    }

    // Send to orchestrator for AI processing
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
        domain: form.domain,
        goalType: form.goalType,
        repoUrl: form.repoUrl || null,
        notionUrl: form.notionUrl || null,
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

  const inputCls = 'bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/60';
  const selectBtnCls = (active: boolean) =>
    `w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${active ? 'border-primary bg-primary/10 text-foreground' : 'border-border/50 bg-muted/20 text-foreground hover:border-border hover:bg-muted/40'}`;

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
        <div className="flex items-center gap-1.5 mt-2">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors duration-300 ${i < step ? 'bg-primary' : i === step ? 'bg-primary/60' : 'bg-muted'}`} />
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
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

        <div className="min-h-[200px]">
          {/* Step 0: Idea */}
          {step === 0 && (
            <div className="space-y-3">
              <Label htmlFor="idea" className="text-foreground text-sm">
                Describe your current idea in 3-5 sentences <span className="text-destructive">*</span>
              </Label>
              <Textarea id="idea" value={form.idea}
                onChange={e => { setForm(p => ({ ...p, idea: e.target.value })); clearError('idea'); }}
                placeholder="e.g., I'm building an AI-powered tool that helps small e-commerce businesses automatically write and optimize product descriptions..."
                className={`min-h-[140px] ${inputCls}`} rows={5}
              />
              {errors.idea && <p className="text-xs text-destructive">{errors.idea}</p>}
            </div>
          )}

          {/* Step 1: User & Problem */}
          {step === 1 && (
            <div className="space-y-3">
              <Label htmlFor="userProblem" className="text-foreground text-sm">
                Who is the primary user, and what painful problem are you solving? <span className="text-destructive">*</span>
              </Label>
              <Textarea id="userProblem" value={form.userProblem}
                onChange={e => { setForm(p => ({ ...p, userProblem: e.target.value })); clearError('userProblem'); }}
                placeholder="e.g., Small e-commerce store owners who spend 2-3 hours daily writing product descriptions..."
                className={`min-h-[140px] ${inputCls}`} rows={5}
              />
              {errors.userProblem && <p className="text-xs text-destructive">{errors.userProblem}</p>}
            </div>
          )}

          {/* Step 2: Domain & Goal */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <Label className="text-foreground text-sm">What type of product? <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {DOMAINS.map(d => (
                    <button key={d.id} type="button" onClick={() => { setForm(p => ({ ...p, domain: d.id })); clearError('domain'); }}
                      className={selectBtnCls(form.domain === d.id)}>
                      <p className="text-sm font-medium">{d.label}</p>
                    </button>
                  ))}
                </div>
                {errors.domain && <p className="text-xs text-destructive">{errors.domain}</p>}
              </div>
              <div className="space-y-3">
                <Label className="text-foreground text-sm">Primary goal right now? <span className="text-destructive">*</span></Label>
                <div className="space-y-2">
                  {GOAL_TYPES.map(g => (
                    <button key={g.id} type="button" onClick={() => { setForm(p => ({ ...p, goalType: g.id })); clearError('goalType'); }}
                      className={selectBtnCls(form.goalType === g.id)}>
                      <p className="text-sm font-medium">{g.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
                    </button>
                  ))}
                </div>
                {errors.goalType && <p className="text-xs text-destructive">{errors.goalType}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Stage */}
          {step === 3 && (
            <div className="space-y-3">
              <Label className="text-foreground text-sm">What is your current stage? <span className="text-destructive">*</span></Label>
              <div className="space-y-2">
                {STAGES.map(s => (
                  <button key={s.id} type="button" onClick={() => { setForm(p => ({ ...p, stage: s.id })); clearError('stage'); }}
                    className={selectBtnCls(form.stage === s.id)}>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
              {errors.stage && <p className="text-xs text-destructive">{errors.stage}</p>}
            </div>
          )}

          {/* Step 4: Skills */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label className="text-foreground text-sm">Select your skills and technologies <span className="text-destructive">*</span></Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SKILL_OPTIONS.map(skill => (
                    <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${form.skills.includes(skill) ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-muted/20 border-border/50 text-muted-foreground hover:border-border hover:text-foreground'}`}>
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="otherSkills" className="text-foreground text-sm">Other skills or experience</Label>
                <Input id="otherSkills" value={form.otherSkills}
                  onChange={e => setForm(p => ({ ...p, otherSkills: e.target.value }))}
                  placeholder="e.g., 5 years backend experience, some ML coursework..." className={inputCls} />
              </div>
              {errors.skills && <p className="text-xs text-destructive">{errors.skills}</p>}
            </div>
          )}

          {/* Step 5: Constraints */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="timeHorizon" className="text-foreground text-sm">
                  Time horizon and availability <span className="text-destructive">*</span>
                </Label>
                <Input id="timeHorizon" value={form.timeHorizon}
                  onChange={e => { setForm(p => ({ ...p, timeHorizon: e.target.value })); clearError('timeHorizon'); }}
                  placeholder="e.g., 3 months full-time, or nights and weekends for 6 months" className={inputCls} />
                {errors.timeHorizon && <p className="text-xs text-destructive">{errors.timeHorizon}</p>}
              </div>
              <div>
                <Label htmlFor="teamSize" className="text-foreground text-sm">Team size</Label>
                <Input id="teamSize" value={form.teamSize}
                  onChange={e => setForm(p => ({ ...p, teamSize: e.target.value }))}
                  placeholder="e.g., Solo, co-founder who handles business" className={inputCls} />
              </div>
              <div>
                <Label htmlFor="budget" className="text-foreground text-sm">Budget for infrastructure and tools</Label>
                <Input id="budget" value={form.budget}
                  onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
                  placeholder="e.g., Bootstrapped ~$200/mo; or seed-funded, flexible" className={inputCls} />
              </div>
              <div className="pt-2 border-t border-border/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Optional Integrations</p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="repoUrl" className="text-foreground text-sm">GitHub repository URL</Label>
                    <Input id="repoUrl" value={form.repoUrl}
                      onChange={e => setForm(p => ({ ...p, repoUrl: e.target.value }))}
                      placeholder="https://github.com/your-org/your-repo" className={inputCls} />
                  </div>
                  <div>
                    <Label htmlFor="notionUrl" className="text-foreground text-sm">Notion workspace URL</Label>
                    <Input id="notionUrl" value={form.notionUrl}
                      onChange={e => setForm(p => ({ ...p, notionUrl: e.target.value }))}
                      placeholder="https://www.notion.so/your-workspace" className={inputCls} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
          <Button variant="ghost" onClick={handleBack} disabled={step === 0} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Rocket className="w-4 h-4 mr-1.5" /> Launch Analysis
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
