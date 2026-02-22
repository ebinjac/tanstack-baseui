import type React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  children?: React.ReactNode;
  className?: string;
  description: React.ReactNode;
  title: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-6 overflow-hidden rounded-3xl bg-primary p-8 shadow-2xl md:flex-row md:items-end md:justify-between md:p-8",
        className
      )}
    >
      {/* Background Base & Pattern */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#006fcf] via-primary to-[#004e9a]" />

      <div
        className="absolute inset-0 z-0 rotate-[1deg] scale-105 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage: `url('/patterns/amex-2.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/40 via-transparent to-transparent mix-blend-multiply" />

      {/* Decorative Glow */}
      <div className="pointer-events-none absolute -top-1/2 -right-1/4 h-[600px] w-[600px] rounded-full bg-white/10 mix-blend-screen blur-[120px]" />

      <div className="relative z-10 flex-1 space-y-4">
        <h1 className="font-black text-4xl text-white tracking-tight drop-shadow-md md:text-5xl">
          {title}
        </h1>
        <p className="max-w-xl font-medium text-base text-white/80 leading-relaxed md:text-lg">
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
