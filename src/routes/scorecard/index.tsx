import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getGlobalScorecardData } from "@/app/actions/scorecard";
import type { AvailabilityRecord } from "@/components/enterprise-scorecard";
import { EnterpriseAnalytics } from "@/components/enterprise-scorecard";
import { EnterpriseScorecardSkeleton } from "@/components/skeletons/enterprise-scorecard-skeleton";

export const Route = createFileRoute("/scorecard/")({
  component: OverviewView,
});

function OverviewView() {
  const [selectedYear] = useState(new Date().getFullYear());

  const { data: scorecardData, isLoading } = useQuery({
    queryKey: ["scorecard", "global", selectedYear],
    queryFn: () => getGlobalScorecardData({ data: { year: selectedYear } }),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <EnterpriseScorecardSkeleton />
      </div>
    );
  }

  const applications = scorecardData?.applications || [];
  const entries = scorecardData?.entries || [];
  const teams = scorecardData?.teams || [];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">
          Enterprise Overview
        </h1>
        <p className="mt-2 text-muted-foreground">
          High-level metrics and trends across all {applications.length}{" "}
          applications managed by {teams.length} teams.
        </p>
      </div>

      <div className="mt-4">
        <EnterpriseAnalytics
          availabilityByEntry={
            scorecardData?.availability.reduce(
              (acc, curr) => {
                if (!acc[curr.scorecardEntryId]) {
                  acc[curr.scorecardEntryId] = {};
                }
                acc[curr.scorecardEntryId][`${curr.year}-${curr.month}`] = curr;
                return acc;
              },
              {} as Record<string, Record<string, AvailabilityRecord>>
            ) || {}
          }
          entries={entries}
          selectedYear={selectedYear}
          totalApps={applications.length}
          totalTeams={teams.length}
          volumeByEntry={
            scorecardData?.volume.reduce(
              (acc, curr) => {
                if (!acc[curr.scorecardEntryId]) {
                  acc[curr.scorecardEntryId] = {};
                }
                acc[curr.scorecardEntryId][`${curr.year}-${curr.month}`] = curr;
                return acc;
              },
              {} as Record<string, Record<string, VolumeRecord>>
            ) || {}
          }
        />
      </div>
    </div>
  );
}
