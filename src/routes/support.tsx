import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BookOpen,
  ExternalLink,
  Hash,
  HeartHandshake,
  Mail,
  MessageSquare,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/support")({
  component: SupportPage,
});

const CONTACT_CHANNELS = [
  {
    icon: Hash,
    label: "Slack",
    title: "#ensemble",
    description:
      "Get help from the Ensemble team and the wider community in real time.",
    action: "Open in Slack",
    href: "https://slack.com/app_redirect?channel=ensemble",
    badge: "Fastest response",
  },
  {
    icon: Mail,
    label: "Email",
    title: "ensemble@axp.com",
    description:
      "Send a detailed message and we'll get back to you within one business day.",
    action: "Send an email",
    href: "mailto:ensemble@axp.com",
    badge: "< 1 business day",
  },
];

const FAQ = [
  {
    q: "I submitted a team registration — when will it be approved?",
    a: "Admins review requests within one business day. You'll receive a confirmation email once approved. If it's been longer than that, reach out via #ensemble on Slack.",
  },
  {
    q: "I can see the portal but my team is missing from the Team Switcher.",
    a: 'Your AD group membership may not have been synced. Click "Refresh Permissions" in your profile dropdown. If the issue persists, contact your team admin to verify you\'ve been added to the correct AD group.',
  },
  {
    q: "Scorecard data looks stale or isn't updating.",
    a: "Scorecard data only appears after an admin publishes a month for the team. Check with your team's admin to confirm data has been published via the Sync Status Bar.",
  },
  {
    q: "The Finalize Turnover button is greyed out.",
    a: "There's a cooldown period between finalizations. A banner on the Dispatch Turnover page will show when you can finalize again. Also ensure there is at least one active entry to dispatch.",
  },
];

function SupportPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="mx-auto max-w-4xl space-y-20 px-6 py-20">
        {/* Hero */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <HeartHandshake className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-black text-4xl tracking-tight">
            We're here to help
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed">
            Reach the Ensemble team through any of the channels below. For quick
            answers, the docs are a great first stop.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <a href="/docs">
              <Button className="gap-2" variant="outline">
                <BookOpen className="h-4 w-4" />
                Browse Docs
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {CONTACT_CHANNELS.map((channel, i) => (
            <motion.a
              animate={{ opacity: 1, y: 0 }}
              className="group relative flex cursor-pointer flex-col gap-5 rounded-3xl border border-border/50 bg-card/50 p-7 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5"
              href={channel.href}
              initial={{ opacity: 0, y: 20 }}
              key={channel.label}
              rel="noopener noreferrer"
              target={channel.href.startsWith("mailto") ? undefined : "_blank"}
              transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
            >
              {/* Icon + Badge Row */}
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <channel.icon className="h-6 w-6" />
                </div>
                <Badge
                  className="gap-1 font-bold text-[10px] uppercase tracking-wide"
                  variant="secondary"
                >
                  <Zap className="h-2.5 w-2.5" />
                  {channel.badge}
                </Badge>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <p className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
                  {channel.label}
                </p>
                <h2 className="font-black text-foreground text-xl tracking-tight">
                  {channel.title}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {channel.description}
                </p>
              </div>

              {/* CTA */}
              <div className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground text-sm transition-opacity hover:opacity-90">
                {channel.label === "Slack" ? (
                  <MessageSquare className="h-4 w-4" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {channel.action}
                <ExternalLink className="h-3 w-3 opacity-70" />
              </div>
            </motion.a>
          ))}
        </div>

        {/* FAQ */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="space-y-1">
            <h2 className="font-black text-2xl tracking-tight">
              Common Questions
            </h2>
            <p className="text-muted-foreground text-sm">
              Answers to the most frequently asked questions about Ensemble.
            </p>
          </div>

          <div className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/50">
            {FAQ.map((item, i) => (
              <motion.div
                animate={{ opacity: 1 }}
                className="space-y-2 bg-card/30 p-5 transition-colors hover:bg-muted/20"
                initial={{ opacity: 0 }}
                key={item.q}
                transition={{ delay: 0.5 + i * 0.07 }}
              >
                <p className="font-semibold text-foreground text-sm">
                  {item.q}
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.a}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          animate={{ opacity: 1 }}
          className="space-y-3 py-8 text-center"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p className="text-muted-foreground text-sm">
            Still have questions? The full documentation covers every feature in
            detail.
          </p>
          <a href="/docs">
            <Button className="gap-2" variant="outline">
              <BookOpen className="h-4 w-4" />
              View Documentation
            </Button>
          </a>
        </motion.div>
      </div>
    </div>
  );
}
