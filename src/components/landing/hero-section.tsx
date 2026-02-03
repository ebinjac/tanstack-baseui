import { Link } from '@tanstack/react-router'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
    LayoutDashboard,
    RefreshCcw,
    Link2,
    ArrowRight,
    Shield,
    Globe,
    Sparkles,
    Zap,
    TrendingUp
} from 'lucide-react'

interface HeroSectionProps {
    session: { user: any } | null;
    scorecardHref: string;
    turnoverHref: string;
    linkManagerHref: string;
}

// Animated counter component for stats
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
    const count = useMotionValue(0)
    const rounded = useTransform(count, (latest) => Math.round(latest))
    const [displayValue, setDisplayValue] = useState(0)

    useEffect(() => {
        const controls = animate(count, value, { duration: 2, ease: "easeOut" })
        const unsubscribe = rounded.on("change", (v) => setDisplayValue(v))
        return () => {
            controls.stop()
            unsubscribe()
        }
    }, [value, count, rounded])

    return <span>{displayValue}{suffix}</span>
}

// Floating geometric shapes for background
function FloatingShape({ delay, duration, className }: { delay: number; duration: number; className: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 100, rotate: 0 }}
            animate={{
                opacity: [0, 0.7, 0.7, 0],
                y: [100, -100],
                rotate: [0, 180],
            }}
            transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: "linear"
            }}
            className={className}
        />
    )
}

export function HeroSection({ session, scorecardHref, turnoverHref, linkManagerHref }: HeroSectionProps) {
    const words = ["Orchestrate.", "Unify.", "Simplify.", "Scale."]
    const [currentWord, setCurrentWord] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWord((prev) => (prev + 1) % words.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    return (
        <>
            {/* === IMMERSIVE BACKGROUND === */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                {/* Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-blue-950/5 dark:to-blue-950/20" />

                {/* Animated mesh gradient */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/8 via-transparent to-indigo-600/8 dark:from-blue-600/5 dark:to-indigo-600/5" />
                    <motion.div
                        animate={{
                            backgroundPosition: ['0% 0%', '100% 100%'],
                        }}
                        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
                        className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)',
                            backgroundSize: '200% 200%'
                        }}
                    />
                </div>

                {/* Floating orbs */}
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 blur-[100px]"
                />
                <motion.div
                    animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-500/15 to-purple-500/10 blur-[100px]"
                />
                <motion.div
                    animate={{ x: [0, 30, 0], y: [0, -50, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-600/10 to-indigo-600/15 blur-[80px]"
                />

                {/* Geometric floating elements */}
                <FloatingShape delay={0} duration={20} className="absolute left-[10%] top-[20%] w-4 h-4 border border-blue-500/20 rounded-sm" />
                <FloatingShape delay={2} duration={25} className="absolute left-[80%] top-[30%] w-6 h-6 border border-indigo-500/20 rounded-full" />
                <FloatingShape delay={4} duration={22} className="absolute left-[20%] top-[60%] w-3 h-3 bg-blue-500/10 rounded-full" />
                <FloatingShape delay={1} duration={28} className="absolute left-[70%] top-[70%] w-5 h-5 border border-cyan-500/20 rotate-45" />
                <FloatingShape delay={3} duration={24} className="absolute left-[50%] top-[40%] w-2 h-2 bg-indigo-500/20 rounded-full" />

                {/* Grid pattern with enhanced masking */}
                <div
                    className="absolute inset-0 opacity-[0.4]"
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, rgba(59, 130, 246, 0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '60px 60px',
                        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 100%)'
                    }}
                />

                {/* Spotlight effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-blue-500/5 via-blue-500/10 to-transparent rounded-full blur-3xl" />

                {/* Noise texture */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
                    }}
                />
            </div>

            <main className="container mx-auto px-4 py-8 max-w-7xl pt-20 md:pt-28">

                {/* === HERO SECTION === */}
                <section className="relative flex flex-col items-center justify-center text-center min-h-[90vh] pb-20">

                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-8 max-w-5xl relative z-10"
                    >
                        {/* Status Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="flex justify-center"
                        >
                            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 backdrop-blur-xl shadow-lg shadow-blue-500/5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-xs font-semibold tracking-wider uppercase text-blue-700 dark:text-blue-300">
                                    Enterprise Ready & Production Grade
                                </span>
                                <Sparkles className="w-3 h-3 text-blue-500" />
                            </div>
                        </motion.div>

                        {/* Main Headline */}
                        <div className="space-y-4">
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                                className="text-sm md:text-base font-medium tracking-[0.3em] uppercase text-muted-foreground"
                            >
                                The Future of Team Operations
                            </motion.p>

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                className="text-6xl md:text-[8rem] font-black tracking-tighter leading-[0.85] select-none"
                            >
                                <span className="block text-foreground">Ensemble.</span>
                                <span className="block relative">
                                    <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                                        {words[currentWord]}
                                    </span>
                                    <span className="invisible">{words[currentWord]}</span>
                                </span>
                            </motion.h1>
                        </div>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.6 }}
                            className="text-lg md:text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed"
                        >
                            Bridging the gap between engineering excellence and operational precision.
                            <br className="hidden md:block" />
                            <span className="text-foreground/80 font-normal">Ensemble is your single, secure mission control for every operational tool.</span>
                        </motion.p>

                        {/* Stats Row */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9, duration: 0.6 }}
                            className="flex flex-wrap justify-center gap-8 md:gap-16 pt-4"
                        >
                            {[
                                { value: 100, suffix: '%', label: 'Uptime SLA' },
                                { value: 50, suffix: '+', label: 'Teams Active' },
                                { value: 10, suffix: 'K+', label: 'Daily Operations' },
                            ].map((stat, i) => (
                                <div key={i} className="text-center group">
                                    <div className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                                        <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                                    </div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1 group-hover:text-blue-500 transition-colors">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* === BENTO GRID === */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-4 mt-20 relative z-20"
                    >
                        {/* Scorecard Card - Large */}
                        <Link to={scorecardHref as any} className="col-span-1 md:col-span-7 group">
                            <div className="h-full min-h-[320px] bg-gradient-to-br from-card via-card to-blue-500/5 border border-border/50 rounded-[2rem] p-8 relative overflow-hidden transition-all duration-700 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.3)] group-hover:-translate-y-2 group-hover:border-blue-500/30">
                                {/* Animated gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 via-blue-600/0 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex items-start justify-between">
                                        <motion.div
                                            whileHover={{ rotate: 5, scale: 1.1 }}
                                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-xl shadow-blue-600/25"
                                        >
                                            <LayoutDashboard className="w-7 h-7" />
                                        </motion.div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Explore</span>
                                            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                                                <ArrowRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Live Metrics</span>
                                        </div>
                                        <h3 className="text-3xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            Scorecard
                                        </h3>
                                        <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
                                            Real-time performance telemetry. Visualize health, latency, and reliability across your entire stack.
                                        </p>
                                    </div>
                                </div>

                                {/* Abstract visualization */}
                                <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-[0.07] group-hover:opacity-[0.15] transition-opacity duration-700">
                                    <svg viewBox="0 0 200 200" className="w-full h-full text-blue-600" fill="currentColor">
                                        <path d="M 0 180 Q 40 140 80 160 T 160 120 T 200 100 V 200 H 0 Z" />
                                        <path d="M 0 160 Q 50 120 100 140 T 200 80 V 200 H 0 Z" opacity="0.5" />
                                    </svg>
                                </div>
                            </div>
                        </Link>

                        {/* Turnover Card */}
                        <Link to={turnoverHref as any} className="col-span-1 md:col-span-5 group">
                            <div className="h-full min-h-[320px] bg-gradient-to-br from-blue-50/80 via-blue-50/50 to-indigo-50/80 dark:from-blue-950/30 dark:via-blue-950/20 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/30 rounded-[2rem] p-8 relative overflow-hidden transition-all duration-700 hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.3)] group-hover:-translate-y-2 group-hover:border-indigo-500/40">
                                {/* Animated ring */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-blue-500/10 dark:border-blue-500/5 rounded-full group-hover:scale-150 group-hover:opacity-0 transition-all duration-1000" />

                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex items-start justify-between">
                                        <motion.div
                                            whileHover={{ rotate: -360 }}
                                            transition={{ duration: 0.6 }}
                                            className="w-14 h-14 rounded-2xl bg-white dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-600 shadow-lg"
                                        >
                                            <RefreshCcw className="w-7 h-7" />
                                        </motion.div>
                                        <div className="w-10 h-10 rounded-full bg-blue-200/50 dark:bg-blue-800/30 flex items-center justify-center text-blue-600 dark:text-blue-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-500" />
                                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Instant Sync</span>
                                        </div>
                                        <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                                            Turnover
                                        </h3>
                                        <p className="text-blue-600/70 dark:text-blue-400/70 text-base">
                                            Seamless shift handoffs. Never miss a critical update again.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Link Manager Card */}
                        <Link to={linkManagerHref as any} className="col-span-1 md:col-span-4 group">
                            <div className="h-full min-h-[220px] bg-card border border-border/50 rounded-[2rem] p-6 relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/5 group-hover:-translate-y-2 group-hover:border-blue-500/20">
                                {/* Dot pattern */}
                                <div
                                    className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500"
                                    style={{
                                        backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                                        backgroundSize: '20px 20px'
                                    }}
                                />

                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-blue-600 group-hover:from-blue-100 group-hover:to-blue-50 dark:group-hover:from-blue-900/30 dark:group-hover:to-blue-950/30 transition-all duration-300">
                                        <Link2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-1 group-hover:text-blue-600 transition-colors">Knowledge Hub</h3>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Link Manager</p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* CTA Card */}
                        <div className="col-span-1 md:col-span-8">
                            {!session ? (
                                <Link to="/teams/register" className="block group">
                                    <div className="h-full min-h-[220px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white text-white dark:text-slate-900 rounded-[2rem] p-8 relative overflow-hidden transition-all duration-700 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] group-hover:-translate-y-2 flex items-center justify-between">
                                        {/* Animated gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                        {/* Shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                        <div className="space-y-4 relative z-10">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 dark:bg-black/10 rounded-full text-xs font-bold border border-white/20 dark:border-black/20 backdrop-blur-sm">
                                                <Shield className="w-3 h-3" /> Enterprise Security
                                            </div>
                                            <h3 className="text-3xl md:text-4xl font-bold">Register your Team</h3>
                                            <p className="opacity-70 max-w-sm">Initialize your workspace and unlock the full power of Ensemble.</p>
                                        </div>

                                        <motion.div
                                            whileHover={{ scale: 1.15, rotate: 5 }}
                                            className="w-16 h-16 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center relative z-10"
                                        >
                                            <ArrowRight className="w-8 h-8" />
                                        </motion.div>
                                    </div>
                                </Link>
                            ) : (
                                <div className="h-full min-h-[220px] bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 border border-border/50 rounded-[2rem] p-8 flex items-center justify-center text-center relative overflow-hidden backdrop-blur-sm group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <div className="space-y-4 relative z-10">
                                        <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-background to-muted border border-border flex items-center justify-center text-muted-foreground">
                                            <Globe className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-foreground mb-1">Welcome back</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Select a module above or continue as <span className="font-medium text-foreground">{session.user?.email}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2"
                    >
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="flex flex-col items-center gap-2 text-muted-foreground/50"
                        >
                            <span className="text-xs uppercase tracking-widest font-medium">Scroll</span>
                            <div className="w-6 h-10 border-2 border-current/30 rounded-full flex justify-center p-2">
                                <motion.div
                                    animate={{ y: [0, 12, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-1 h-2 bg-current rounded-full"
                                />
                            </div>
                        </motion.div>
                    </motion.div>

                </section>
            </main >
        </>
    )
}
