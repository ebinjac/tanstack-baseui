import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Check, Shield, Users } from "lucide-react";
import { SectionBadge } from "./section-badge";

interface OnboardingStepsProps {
  isLoggedIn: boolean;
}

export function OnboardingSteps({ isLoggedIn }: OnboardingStepsProps) {
  return (
    <section className="relative overflow-hidden py-32">
      <motion.div
        className="relative z-10 mb-20 text-center"
        initial={{ opacity: 0, y: 30 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <SectionBadge label="How It Works" />
        </div>
        <h2 className="font-black text-4xl text-foreground tracking-tight drop-shadow-sm md:text-6xl">
          Onboard in 3 simple steps.
        </h2>
      </motion.div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Connecting Line (Desktop) */}
        <div className="absolute top-10 right-[15%] left-[15%] z-0 hidden h-1 overflow-hidden rounded-full bg-border/40 md:block">
          <motion.div
            className="h-full bg-primary/30"
            initial={{ width: "0%" }}
            transition={{ duration: 1.5, delay: 0.2 }}
            whileInView={{ width: "100%" }}
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-3 lg:gap-16">
          <StepDefineTeam />
          <StepSecureAccess />
          <StepInstantLaunch />
        </div>
      </div>

      {!isLoggedIn && (
        <div className="mt-20 text-center">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-4 font-bold text-lg text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
            to="/teams/register"
          >
            Start the Wizard <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      )}
    </section>
  );
}

function StepBadge({ number }: { number: number }) {
  return (
    <div className="absolute -top-3 -right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-black font-black text-sm text-white shadow-sm">
      {number}
    </div>
  );
}

function StepDefineTeam() {
  return (
    <motion.div
      className="group flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="relative mb-6">
        <div className="relative z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-2 border-border bg-card shadow-xl transition-colors group-hover:border-primary/40">
          <div className="absolute inset-0 bg-primary/5 transition-colors group-hover:bg-primary/10" />
          <Users className="h-8 w-8 text-primary drop-shadow-sm" />
        </div>
        <StepBadge number={1} />
      </div>
      <div className="mb-6 space-y-3">
        <h3 className="font-black text-2xl text-foreground tracking-tight drop-shadow-sm">
          Define Your Team
        </h3>
        <p className="px-2 font-medium text-muted-foreground text-sm leading-relaxed lg:px-4">
          Provide a name, enter a brief description, and assign primary contacts
          in seconds. No complex paperwork or tickets.
        </p>
      </div>
      <div className="relative mt-auto w-full cursor-default overflow-hidden rounded-[1.5rem] border border-border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md">
        <div className="relative z-10 space-y-4">
          <div className="space-y-1.5">
            <div className="font-black text-[9px] text-muted-foreground uppercase tracking-widest">
              Team Name
            </div>
            <div className="flex h-10 w-full items-center rounded-xl border border-border bg-background px-3 shadow-inner">
              <span className="font-bold text-foreground text-xs">
                Information_Security_SRE
              </span>
              <motion.div
                className="ml-auto flex h-5 w-5 items-center justify-center rounded-full border border-success/20 bg-success/10 text-success"
                initial={{ scale: 0 }}
                transition={{ delay: 0.4 }}
                whileInView={{ scale: 1 }}
              >
                <Check className="h-3 w-3" />
              </motion.div>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="font-black text-[9px] text-muted-foreground uppercase tracking-widest">
              Description
            </div>
            <div className="flex h-14 w-full rounded-xl border border-border bg-background p-3 shadow-inner">
              <span className="font-medium text-[10px] text-muted-foreground italic">
                Core trading infrastructure...
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StepSecureAccess() {
  return (
    <motion.div
      className="group flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="relative mb-6">
        <div className="relative z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-2 border-border bg-card shadow-xl transition-colors group-hover:border-primary/40">
          <div className="absolute inset-0 bg-primary/5 transition-colors group-hover:bg-primary/10" />
          <Shield className="h-8 w-8 text-primary drop-shadow-sm" />
        </div>
        <StepBadge number={2} />
      </div>
      <div className="mb-6 space-y-3">
        <h3 className="font-black text-2xl text-foreground tracking-tight drop-shadow-sm">
          Secure Access
        </h3>
        <p className="px-2 font-medium text-muted-foreground text-sm leading-relaxed lg:px-4">
          Configure permissions instantly by linking your existing Active
          Directory groups. Zero friction, enterprise security.
        </p>
      </div>
      <div className="relative mt-auto w-full cursor-default overflow-hidden rounded-[1.5rem] border border-border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md">
        <div className="relative z-10 space-y-4">
          <AccessGroupRow
            group="PRC_ENSEMBLE-IS-SRE-USERS"
            label="User Access Group"
          />
          <AccessGroupRow
            group="PRC_ENSEMBLE-IS-SRE-ADMIN"
            isAdmin
            label="Admin Access Group"
          />
        </div>
      </div>
    </motion.div>
  );
}

interface AccessGroupRowProps {
  group: string;
  isAdmin?: boolean;
  label: string;
}

function AccessGroupRow({ label, group, isAdmin }: AccessGroupRowProps) {
  return (
    <div className="group/item relative rounded-xl border border-border bg-background p-3 shadow-inner transition-colors hover:border-primary/40">
      <div className="mb-1.5 flex items-center gap-1.5 pl-1 font-bold text-[8px] text-muted-foreground uppercase tracking-widest">
        {isAdmin ? (
          <Shield className="h-3 w-3 text-secondary" />
        ) : (
          <Users className="h-3 w-3" />
        )}{" "}
        {label}
      </div>
      <div className="flex items-center gap-2 px-1">
        <div className="h-1.5 w-1.5 rounded-full bg-success" />
        <span className="truncate font-black text-xs tracking-tight">
          {group}
        </span>
      </div>
    </div>
  );
}

function StepInstantLaunch() {
  return (
    <motion.div
      className="group flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="relative mb-6">
        <div className="relative z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-2 border-border bg-card shadow-xl transition-colors group-hover:border-primary/40">
          <div className="absolute inset-0 bg-primary/5 transition-colors group-hover:bg-primary/10" />
          <Activity className="h-8 w-8 text-primary drop-shadow-sm" />
        </div>
        <StepBadge number={3} />
      </div>
      <div className="mb-6 space-y-3">
        <h3 className="font-black text-2xl text-foreground tracking-tight drop-shadow-sm">
          Instant Launch
        </h3>
        <p className="px-2 font-medium text-muted-foreground text-sm leading-relaxed lg:px-4">
          Hit submit and your robust suite is provisioned automatically.
          Scorecards, Turnover, and more ready immediately.
        </p>
      </div>
      <div className="relative mt-auto flex min-h-[160px] w-full cursor-default items-center justify-center overflow-hidden rounded-[1.5rem] border border-border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md">
        <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/amex-1.png')] bg-cover opacity-[0.03] transition-opacity group-hover:opacity-[0.06]" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
          <motion.div
            className="relative flex h-16 w-16 items-center justify-center rounded-full border border-success/30 bg-success/15 text-success shadow-lg shadow-success/20"
            initial={{ scale: 0.5, opacity: 0 }}
            transition={{ delay: 0.8, type: "spring" }}
            whileInView={{ scale: 1, opacity: 1 }}
          >
            <Check className="relative z-10 h-8 w-8 drop-shadow-sm" />
            <div className="absolute inset-0 animate-ping rounded-full border-2 border-success opacity-30" />
          </motion.div>
          <div className="text-center">
            <div className="font-black text-sm drop-shadow-sm">
              Workspace Automated!
            </div>
            <div className="mt-1.5 rounded-md border border-border bg-muted/30 px-3 py-1 font-black text-[10px] text-muted-foreground uppercase tracking-widest">
              Tools Initialized
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
