import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
    BookOpen,
    ExternalLink,
    Hash,
    HeartHandshake,
    Mail,
    MessageSquare,
    Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/support')({
    component: SupportPage,
})

const CONTACT_CHANNELS = [
    {
        icon: Hash,
        label: 'Slack',
        title: '#ensemble',
        description:
            'Get help from the Ensemble team and the wider community in real time.',
        action: 'Open in Slack',
        href: 'https://slack.com/app_redirect?channel=ensemble',
        badge: 'Fastest response',
    },
    {
        icon: Mail,
        label: 'Email',
        title: 'ensemble@axp.com',
        description:
            'Send a detailed message and we\'ll get back to you within one business day.',
        action: 'Send an email',
        href: 'mailto:ensemble@axp.com',
        badge: '< 1 business day',
    },
]

const FAQ = [
    {
        q: 'I submitted a team registration — when will it be approved?',
        a: 'Admins review requests within one business day. You\'ll receive a confirmation email once approved. If it\'s been longer than that, reach out via #ensemble on Slack.',
    },
    {
        q: 'I can see the portal but my team is missing from the Team Switcher.',
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
]

function SupportPage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            <div className="max-w-4xl mx-auto px-6 py-20 space-y-20">

                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-4"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
                        <HeartHandshake className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">We're here to help</h1>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        Reach the Ensemble team through any of the channels below. For quick
                        answers, the docs are a great first stop.
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <a href="/docs">
                            <Button variant="outline" className="gap-2">
                                <BookOpen className="w-4 h-4" />
                                Browse Docs
                            </Button>
                        </a>
                    </div>
                </motion.div>

                {/* Contact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {CONTACT_CHANNELS.map((channel, i) => (
                        <motion.a
                            key={channel.label}
                            href={channel.href}
                            target={channel.href.startsWith('mailto') ? undefined : '_blank'}
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                            className="group relative flex flex-col gap-5 p-7 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                        >
                            {/* Icon + Badge Row */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary">
                                    <channel.icon className="w-6 h-6" />
                                </div>
                                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wide gap-1">
                                    <Zap className="w-2.5 h-2.5" />
                                    {channel.badge}
                                </Badge>
                            </div>

                            {/* Content */}
                            <div className="space-y-1.5">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    {channel.label}
                                </p>
                                <h2 className="text-xl font-black tracking-tight text-foreground">
                                    {channel.title}
                                </h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {channel.description}
                                </p>
                            </div>

                            {/* CTA */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold w-fit bg-primary text-primary-foreground transition-opacity hover:opacity-90">
                                {channel.label === 'Slack' ? (
                                    <MessageSquare className="w-4 h-4" />
                                ) : (
                                    <Mail className="w-4 h-4" />
                                )}
                                {channel.action}
                                <ExternalLink className="w-3 h-3 opacity-70" />
                            </div>
                        </motion.a>
                    ))}
                </div>

                {/* FAQ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="space-y-6"
                >
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black tracking-tight">Common Questions</h2>
                        <p className="text-sm text-muted-foreground">
                            Answers to the most frequently asked questions about Ensemble.
                        </p>
                    </div>

                    <div className="divide-y divide-border/50 border border-border/50 rounded-2xl overflow-hidden">
                        {FAQ.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + i * 0.07 }}
                                className="p-5 space-y-2 bg-card/30 hover:bg-muted/20 transition-colors"
                            >
                                <p className="text-sm font-semibold text-foreground">{item.q}</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="text-center space-y-3 py-8"
                >
                    <p className="text-sm text-muted-foreground">
                        Still have questions? The full documentation covers every feature in detail.
                    </p>
                    <a href="/docs">
                        <Button variant="outline" className="gap-2">
                            <BookOpen className="w-4 h-4" />
                            View Documentation
                        </Button>
                    </a>
                </motion.div>

            </div>
        </div>
    )
}
