import { Link } from '@tanstack/react-router'
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'
import { LayoutDashboard } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
    RefreshCcw,
    Link2,
    ArrowRight,
    Shield
} from 'lucide-react'

interface HeroSectionProps {
    session: { user: any } | null;
    scorecardHref: string;
    turnoverHref: string;
    linkManagerHref: string;
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

export function HeroSection({ session: _session, scorecardHref, turnoverHref, linkManagerHref }: HeroSectionProps) {
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
            {/* === BACKGROUND === */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-background">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

                {/* Subtle Grid Pattern for Main Page */}
                <div className="absolute inset-0 opacity-[0.3]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.1) 1px, transparent 0)`,
                        backgroundSize: '40px 40px',
                        maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)'
                    }}
                />
            </div>

            <main className="container mx-auto px-4 py-8 max-w-7xl pt-20 md:pt-32">

                {/* === HERO HEADER === */}
                <section className="relative flex flex-col items-center justify-center text-center min-h-[60vh] pb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-8 max-w-4xl relative z-10"
                    >
                        {/* Status Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex justify-center"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground border border-border shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                </span>
                                <span className="text-xs font-semibold tracking-wide uppercase">
                                    System v2.0
                                </span>
                            </div>
                        </motion.div>

                        {/* Headline */}
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] select-none text-foreground">
                            Ensemble.
                            <br />
                            <span className="text-primary opacity-90">{words[currentWord]}</span>
                        </h1>

                        {/* Description */}
                        <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
                            The operating system for high-velocity engineering teams.
                            <br className="hidden md:block" />
                            <span className="text-foreground font-medium">Unified Visibility. Zero Friction.</span>
                        </p>
                    </motion.div>
                </section>

                {/* === BENTO GRID WITH PATTERN CARDS === */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 relative z-20 pb-20"
                >
                    {/* Scorecard Card */}
                    <Link to={scorecardHref as any} className="col-span-1 md:col-span-7 group">
                        <div className="relative h-full min-h-[400px] rounded-[2rem] overflow-hidden bg-primary shadow-2xl transition-transform duration-500 hover:scale-[1.01]">
                            {/* Pattern Background Image */}
                            <div
                                className="absolute inset-0 mix-blend-overlay opacity-40 group-hover:opacity-50 transition-opacity duration-700"
                                style={{
                                    backgroundImage: `url('/patterns/amex-1.png')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    filter: 'contrast(1.2) brightness(0.8)'
                                }}
                            />

                            {/* Content Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            <div className="relative z-10 p-10 flex flex-col h-full justify-between text-white">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                        <LayoutDashboard className="w-8 h-8 text-white" />
                                    </div>
                                    <ArrowRight className="w-6 h-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </div>

                                <div className="space-y-2">
                                    <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider mb-2">
                                        Live Telemetry
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-md">
                                        Scorecard
                                    </h3>
                                    <p className="text-lg text-white/80 font-light max-w-md">
                                        Real-time operational health. Visualize your engineering velocity and reliability.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Turnover Card */}
                    <Link to={turnoverHref as any} className="col-span-1 md:col-span-5 group">
                        <div className="relative h-full min-h-[400px] rounded-[2rem] overflow-hidden bg-primary/90 shadow-2xl transition-transform duration-500 hover:scale-[1.01]">
                            {/* Pattern Background Image (Different Alignment) */}
                            <div
                                className="absolute inset-0 mix-blend-overlay opacity-30 group-hover:opacity-40 transition-opacity duration-700"
                                style={{
                                    backgroundImage: `url('/patterns/amex-1.png')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'top right',
                                    filter: 'contrast(1.2) brightness(0.8)'
                                }}
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            <div className="relative z-10 p-10 flex flex-col h-full justify-between text-white">
                                <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-fit">
                                    <RefreshCcw className="w-8 h-8 text-white" />
                                </div>

                                <div className="space-y-2 mt-auto">
                                    <h3 className="text-4xl font-bold tracking-tight text-white drop-shadow-md">
                                        Turnover
                                    </h3>
                                    <p className="text-lg text-white/80 font-light">
                                        Seamless shift handoffs. <br />Zero information loss.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Link Manager Card */}
                    <Link to={linkManagerHref as any} className="col-span-1 md:col-span-4 group">
                        <div className="relative h-full min-h-[280px] rounded-[2rem] overflow-hidden bg-[#2C2C2C] shadow-xl transition-transform duration-500 hover:scale-[1.02]">
                            {/* Pattern Background Image (Zoomed) */}
                            <div
                                className="absolute inset-0 mix-blend-overlay opacity-20 group-hover:opacity-30 transition-opacity duration-700"
                                style={{
                                    backgroundImage: `url('/patterns/amex-1.png')`,
                                    backgroundSize: '200%',
                                    backgroundPosition: 'center',
                                    filter: 'grayscale(1)'
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                            <div className="relative z-10 p-8 flex flex-col h-full justify-between text-white">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                                    <Link2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-1">Link Manager</h3>
                                    <p className="text-sm text-white/60">The central nervous system for knowledge.</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* CTA / Quick Actions */}
                    <div className="col-span-1 md:col-span-8">
                        <Link to="/teams/register" className="block h-full group">
                            <div className="relative h-full min-h-[280px] rounded-[2rem] overflow-hidden bg-foreground text-background shadow-xl transition-transform duration-500 hover:scale-[1.01]">
                                <div
                                    className="absolute inset-0 opacity-10 mix-blend-overlay group-hover:opacity-20 transition-opacity"
                                    style={{
                                        backgroundImage: `url('/patterns/amex-1.png')`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'bottom',
                                    }}
                                />

                                <div className="relative z-10 p-10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
                                    <div className="space-y-4 max-w-lg">
                                        <div className="flex items-center gap-2 text-background/60 text-sm font-bold uppercase tracking-wider">
                                            <Shield className="w-4 h-4" /> Enterprise Grade
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-bold text-background">Ready to synchronize?</h3>
                                        <p className="text-background/70 text-lg">Initialize your workspace in seconds.</p>
                                    </div>

                                    <div className="h-16 px-10 rounded-full bg-background text-foreground text-lg font-bold flex items-center gap-3 shadow-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        Get Started <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                </motion.div>
            </main>
        </>
    )
}
