import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
    return (
        <div className={cn("relative rounded-3xl overflow-hidden bg-primary p-8 md:p-8 shadow-2xl flex flex-col md:flex-row md:items-end md:justify-between gap-6", className)}>
            {/* Background Base & Pattern */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#00175a] via-primary to-[#004e9a]" />

            <div
                className="absolute inset-0 z-0 opacity-40 mix-blend-overlay rotate-[1deg] scale-105"
                style={{
                    backgroundImage: `url('/patterns/amex-1.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/40 via-transparent to-transparent mix-blend-multiply" />

            {/* Decorative Glow */}
            <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-white/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

            <div className="relative z-10 space-y-4 flex-1">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
                    {title}
                </h1>
                <p className="text-base md:text-lg text-white/80 max-w-xl font-medium leading-relaxed">
                    {description}
                </p>
            </div>

            {children && (
                <div className="relative z-10 flex flex-wrap items-center gap-3">
                    {children}
                </div>
            )}
        </div>
    );
}
