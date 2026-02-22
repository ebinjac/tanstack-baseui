import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  subLabel: string;
  value: string | number;
}

export function StatsCard({ icon, label, value, subLabel }: StatsCardProps) {
  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-muted-foreground text-xs">{label}</p>
            <p className="truncate font-bold text-xl tabular-nums leading-tight">
              {value}
            </p>
            <p className="text-[10px] text-muted-foreground">{subLabel}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface InfoItemProps {
  desc: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function InfoItem({ icon, label, value, desc }: InfoItemProps) {
  return (
    <div className="space-y-1 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs">
        {icon} {label}
      </div>
      <p className="select-all truncate font-semibold text-sm">
        {value || "Not Configured"}
      </p>
      <p className="text-[11px] text-muted-foreground">{desc}</p>
    </div>
  );
}

interface ToolItemProps {
  desc: string;
  icon: React.ReactNode;
  link: string;
  title: string;
}

export function ToolItem({ icon, title, desc, link }: ToolItemProps) {
  return (
    <a
      className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
      href={link}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground transition-colors group-hover:text-primary">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-muted-foreground text-xs">{desc}</p>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}
