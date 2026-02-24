import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Boxes,
  FileCheck,
  LayoutDashboard,
  Plus,
  RefreshCcw,
  Save,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { getTeamApplications } from "@/app/actions/applications";
import {
  getTurnoverSettings,
  syncItsmItems,
  updateTurnoverSettings,
} from "@/app/actions/itsm";
import { SettingsNav } from "@/components/settings";
import { PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { UpdateTurnoverSettingsSchema } from "@/lib/zod/itsm.schema";

export const Route = createFileRoute("/teams/$teamId/turnover/settings")({
  component: TurnoverSettingsPage,
});

interface AppWorkgroup {
  applicationId: string;
  groupName: string;
  id?: string;
  type: "RFC" | "INC";
}

interface AppCmdbCi {
  applicationId: string;
  cmdbCiName: string;
  id?: string;
}

function TurnoverSettingsPage() {
  const { teamId } = Route.useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["turnover-settings", teamId],
    queryFn: () => getTurnoverSettings({ data: teamId }),
  });

  const { data: apps, isLoading: isLoadingApps } = useQuery({
    queryKey: ["applications", teamId],
    queryFn: () => getTeamApplications({ data: { teamId } }),
  });

  const updateMutation = useMutation({
    mutationFn: updateTurnoverSettings,
    onSuccess: () => {
      toast.success("Settings saved successfully");
      queryClient.invalidateQueries({
        queryKey: ["turnover-settings", teamId],
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncItsmItems,
    onSuccess: (data: { success: boolean; message?: string }) => {
      if (data.success) {
        toast.success("ITSM sync triggered successfully");
      } else {
        toast.error(data.message || "Sync failed");
      }
    },
  });

  const form = useForm({
    resolver: zodResolver(UpdateTurnoverSettingsSchema),
    defaultValues: {
      teamId,
      settings: {
        rfcImportMode: "REVIEW",
        incImportMode: "REVIEW",
        appWorkgroups: [] as AppWorkgroup[],
        appCmdbCis: [] as AppCmdbCi[],
      },
    },
    values: settings
      ? {
          teamId,
          settings: {
            maxSearchDays: settings.maxSearchDays,
            rfcImportMode: settings.rfcImportMode as "AUTO" | "REVIEW",
            incImportMode: settings.incImportMode as "AUTO" | "REVIEW",
            appWorkgroups: settings.appWorkgroups as AppWorkgroup[],
            appCmdbCis: settings.appCmdbCis as AppCmdbCi[],
          },
        }
      : undefined,
  });

  const isLoading = isLoadingSettings || isLoadingApps;

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const navItems = [
    { value: "general", label: "General", icon: LayoutDashboard },
    ...(apps?.map((app: { id: string; applicationName: string }) => ({
      value: app.id,
      label: app.applicationName,
      icon: Boxes,
    })) || []),
  ];

  function onSubmit(values: z.infer<typeof UpdateTurnoverSettingsSchema>) {
    updateMutation.mutate({ data: values });
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <PageHeader
        description="Configure ITSM integration and import workflows for your turnover operations."
        title="Turnover Settings"
      />

      <div className="flex flex-col gap-8 md:flex-row">
        <SettingsNav
          activeTab={activeTab}
          items={navItems}
          onTabChange={setActiveTab}
        />

        <div className="min-w-0 flex-1">
          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              {activeTab === "general" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-primary" />
                        Global Configurations
                      </CardTitle>
                      <CardDescription>
                        Set default behavior for ITSM synchronization across all
                        applications.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="settings.maxSearchDays"
                        render={({ field }) => (
                          <FormItem className="space-y-4">
                            <FormLabel className="text-base">
                              Sync Look-back Range
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                className="grid grid-cols-5 gap-4"
                                onValueChange={(val) =>
                                  field.onChange(Number(val))
                                }
                                value={String(field.value)}
                              >
                                {[1, 2, 3, 4, 5].map((day) => (
                                  <FormItem key={day}>
                                    <FormControl>
                                      <RadioGroupItem
                                        className="sr-only"
                                        value={String(day)}
                                      />
                                    </FormControl>
                                    <FormLabel
                                      className={cn(
                                        "flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 transition-all duration-200 hover:border-primary/50 hover:bg-accent",
                                        Number(field.value) === day &&
                                          "border-primary bg-primary/5 ring-1 ring-primary"
                                      )}
                                    >
                                      <span className="font-bold text-2xl">
                                        {day}
                                      </span>
                                      <span className="font-semibold text-[10px] text-muted-foreground uppercase">
                                        {day === 1 ? "Day" : "Days"}
                                      </span>
                                    </FormLabel>
                                  </FormItem>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormDescription>
                              Select how many days of history to sync from ITSM.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Separator />
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="settings.rfcImportMode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>RFC Import Mode</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value ?? "REVIEW"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="REVIEW">
                                    Review Before Import
                                  </SelectItem>
                                  <SelectItem value="AUTO">
                                    Auto Import
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="settings.incImportMode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Incident Import Mode</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value ?? "REVIEW"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="REVIEW">
                                    Review Before Import
                                  </SelectItem>
                                  <SelectItem value="AUTO">
                                    Auto Import
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 p-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Manual Sync</h4>
                      <p className="text-muted-foreground text-xs">
                        Trigger an immediate fetch of ITSM records.
                      </p>
                    </div>
                    <Button
                      disabled={syncMutation.isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        syncMutation.mutate({ data: { teamId } });
                      }}
                      type="button"
                      variant="outline"
                    >
                      <RefreshCcw
                        className={cn(
                          "mr-2 h-4 w-4",
                          syncMutation.isPending && "animate-spin"
                        )}
                      />
                      Sync Now
                    </Button>
                  </div>
                </div>
              )}

              {apps?.map(
                (app: { id: string; applicationName: string }) =>
                  app.id === activeTab && (
                    <div className="space-y-6" key={app.id}>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Boxes className="h-5 w-5 text-primary" />
                            {app.applicationName} ITSM Groups
                          </CardTitle>
                          <CardDescription>
                            Configure the ITSM assignment groups for this
                            application. Records from these groups will be
                            linked to this application.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-4">
                            <WorkgroupList
                              applicationId={app.id}
                              label="RFC Groups"
                              type="RFC"
                            />
                            <Separator />
                            <WorkgroupList
                              applicationId={app.id}
                              label="Incident Groups"
                              type="INC"
                            />
                            <Separator />
                            <CmdbCiList
                              applicationId={app.id}
                              label="CMDB CIs"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
              )}

              <div className="mt-8 flex justify-end">
                <Button disabled={updateMutation.isPending} type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

function WorkgroupList({
  applicationId,
  type,
  label,
}: {
  applicationId: string;
  type: "RFC" | "INC";
  label: string;
}) {
  const { getValues, setValue, watch } = useFormContext();
  const [newGroup, setNewGroup] = useState("");

  const groups = watch("settings.appWorkgroups") || [];
  const currentGroups = groups.filter(
    (g: AppWorkgroup) => g.applicationId === applicationId && g.type === type
  );

  const handleAdd = () => {
    if (!newGroup.trim()) {
      return;
    }
    const current = getValues("settings.appWorkgroups") || [];
    setValue("settings.appWorkgroups", [
      ...current,
      { applicationId, type, groupName: newGroup.trim() },
    ]);
    setNewGroup("");
  };

  const handleRemove = (groupName: string) => {
    const current = getValues("settings.appWorkgroups") || [];
    setValue(
      "settings.appWorkgroups",
      current.filter(
        (g: AppWorkgroup) =>
          !(
            g.applicationId === applicationId &&
            g.type === type &&
            g.groupName === groupName
          )
      )
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <FormLabel>{label}</FormLabel>
        <FormDescription className="text-xs">
          Add one or more assignment groups for {type}s.
        </FormDescription>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {currentGroups.map((g: AppWorkgroup) => (
          <Badge
            className="gap-1 px-2 py-1"
            key={g.groupName}
            variant="secondary"
          >
            {g.groupName}
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => handleRemove(g.groupName)}
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {currentGroups.length === 0 && (
          <span className="text-muted-foreground text-xs italic">
            No groups configured
          </span>
        )}
      </div>
      <div className="mt-2 flex max-w-sm gap-2">
        <Input
          className="h-8 text-sm"
          onChange={(e) => setNewGroup(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Enter workgroup name..."
          value={newGroup}
        />
        <Button
          className="h-8 shrink-0"
          onClick={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add
        </Button>
      </div>
    </div>
  );
}

function CmdbCiList({
  applicationId,
  label,
}: {
  applicationId: string;
  label: string;
}) {
  const { getValues, setValue, watch } = useFormContext();
  const [newCi, setNewCi] = useState("");

  const cis = watch("settings.appCmdbCis") || [];
  const currentCis = cis.filter(
    (c: AppCmdbCi) => c.applicationId === applicationId
  );

  const handleAdd = () => {
    if (!newCi.trim()) {
      return;
    }
    const current = getValues("settings.appCmdbCis") || [];
    setValue("settings.appCmdbCis", [
      ...current,
      { applicationId, cmdbCiName: newCi.trim() },
    ]);
    setNewCi("");
  };

  const handleRemove = (cmdbCiName: string) => {
    const current = getValues("settings.appCmdbCis") || [];
    setValue(
      "settings.appCmdbCis",
      current.filter(
        (c: AppCmdbCi) =>
          !(c.applicationId === applicationId && c.cmdbCiName === cmdbCiName)
      )
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <FormLabel>{label}</FormLabel>
        <FormDescription className="text-xs">
          Add specific CMDB CIs for this application to filter RFCs.
        </FormDescription>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {currentCis.map((c: AppCmdbCi) => (
          <Badge
            className="gap-1 px-2 py-1"
            key={c.cmdbCiName}
            variant="outline"
          >
            {c.cmdbCiName}
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => handleRemove(c.cmdbCiName)}
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {currentCis.length === 0 && (
          <span className="text-muted-foreground text-xs italic">
            No CMDB CIs configured
          </span>
        )}
      </div>
      <div className="mt-2 flex max-w-sm gap-2">
        <Input
          className="h-8 text-sm"
          onChange={(e) => setNewCi(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Enter CMDB CI name..."
          value={newCi}
        />
        <Button
          className="h-8 shrink-0"
          onClick={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add
        </Button>
      </div>
    </div>
  );
}
