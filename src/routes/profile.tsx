import {
  createFileRoute,
  Link,
  redirect,
  useRouteContext,
  useRouter,
} from "@tanstack/react-router";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Mail,
  Plus,
  RefreshCcw,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginUser } from "../app/ssr/auth";
import { useAuthBlueSSO } from "../components/use-authblue-sso";

export const Route = createFileRoute("/profile")({
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { session } = useRouteContext({ from: "__root__" });
  // Session is guaranteed to exist here due to beforeLoad redirect
  // biome-ignore lint/style/noNonNullAssertion: session guaranteed by beforeLoad redirect
  const { user, permissions } = session!;
  const ssoUser = useAuthBlueSSO();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!ssoUser) {
      toast.error("SSO Identity not found");
      return;
    }
    setIsRefreshing(true);
    try {
      // Re-authenticate to refresh permissions from DB
      await loginUser({ data: ssoUser });

      // Invalidate router to reload loader data
      await router.invalidate();

      toast.success("Permissions refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh session:", error);
      toast.error("Failed to refresh session");
    } finally {
      setIsRefreshing(false);
    }
  };

  const initials =
    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  const isAdmin = permissions.some((p) => p.role === "ADMIN");

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Cover Banner */}
      <div className="relative h-64 overflow-hidden border-border/50 border-b bg-primary/10">
        <div
          className="pointer-events-none absolute inset-0 bg-center bg-cover mix-blend-overlay"
          style={{ backgroundImage: `url('/patterns/amex-2.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
      </div>

      <div className="container relative z-10 mx-auto -mt-18 max-w-5xl space-y-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col items-center justify-between gap-6 border-border/50 border-b pb-6 md:flex-row md:items-end">
          <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-end">
            <Avatar className="h-32 w-32 flex-shrink-0 border-4 border-background shadow-2xl ring-1 ring-border/10 ring-offset-2 ring-offset-background">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 font-black text-4xl text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="mb-2 flex w-full flex-col space-y-4 md:flex-row md:items-end md:justify-between md:space-y-2">
              <div className="space-y-2 text-center md:text-left">
                <h1 className="flex flex-col items-center gap-3 font-black text-4xl tracking-tight md:flex-row">
                  {user.firstName} {user.lastName}
                  {isAdmin && (
                    <Badge
                      className="h-6 gap-1 bg-primary px-2 font-bold text-primary-foreground text-xs uppercase tracking-widest"
                      variant="default"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> Platform Admin
                    </Badge>
                  )}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-4 font-medium text-muted-foreground text-sm md:justify-start">
                  <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/50 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                    <Mail className="h-4 w-4 text-primary opacity-80" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/50 px-3 py-1.5 shadow-sm backdrop-blur-sm">
                    <Shield className="h-4 w-4 text-primary opacity-80" />
                    <span>ADS ID: {user.adsId}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex w-full gap-3 pt-4 md:mt-0 md:w-auto md:pt-0">
                <Button
                  className="w-full gap-2 border-border bg-background/80 font-semibold shadow-sm backdrop-blur-sm hover:bg-background/100 md:w-auto"
                  disabled={isRefreshing}
                  onClick={handleRefresh}
                  variant="outline"
                >
                  <RefreshCcw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh Permissions
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Overview Card */}
            <Card className="relative overflow-hidden border-border/50 bg-card/50 shadow-black/5 shadow-lg backdrop-blur-xl">
              <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Profile Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-border/50 bg-background p-2 shadow-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="font-semibold text-sm">Total Teams</span>
                  </div>
                  <span className="font-black text-lg">
                    {permissions.length}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-border/50 bg-background p-2 shadow-sm">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="font-semibold text-sm">Clearance</span>
                  </div>
                  <Badge
                    className="shadow-sm"
                    variant={isAdmin ? "default" : "secondary"}
                  >
                    {isAdmin ? "Admin" : "User"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-border/50 bg-background p-2 shadow-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="font-semibold text-sm">
                      Joined Platform
                    </span>
                  </div>
                  <span className="font-bold text-muted-foreground text-sm">
                    Dec 2025
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="relative overflow-hidden border-primary/20 bg-primary/5 shadow-lg shadow-primary/5">
              <div
                className="pointer-events-none absolute inset-0 bg-center bg-cover"
                style={{
                  backgroundImage: `url('/patterns/amex-2.jpg')`,
                  opacity: 0.05,
                }}
              />
              <CardHeader className="relative z-10 pb-3">
                <CardTitle className="font-bold text-lg">
                  Need a new workspace?
                </CardTitle>
                <CardDescription className="font-medium text-primary/70">
                  Register a team and get access to Scorecard and TO-HUB
                  immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <Link className="w-full" to="/teams/register">
                  <Button className="w-full gap-2 font-bold shadow-primary/20 shadow-xl">
                    <Plus className="h-4 w-4" />
                    Register New Team
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Teams List */}
          <div className="space-y-6 md:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-2xl tracking-tight">
                Active Workspaces{" "}
                <span className="font-semibold text-muted-foreground">
                  ({permissions.length})
                </span>
              </h2>
            </div>

            {permissions.length === 0 ? (
              <Card className="border-2 border-dashed bg-transparent shadow-none">
                <CardContent className="flex flex-col items-center justify-center space-y-5 py-20 text-center">
                  <div className="relative rounded-3xl bg-primary/10 p-5">
                    <Briefcase className="relative z-10 h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl tracking-tight">
                      No Teams Found
                    </h3>
                    <p className="mx-auto max-w-sm text-muted-foreground leading-relaxed">
                      You haven't been granted access to any Ensemble workspaces
                      yet.
                    </p>
                  </div>
                  <Link to="/teams/register">
                    <Button className="gap-2 rounded-xl font-bold text-sm shadow-md">
                      <Plus className="h-4 w-4" />
                      Create your first team
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {permissions.map((perm) => (
                  <div className="h-full" key={perm.teamId}>
                    <Link
                      className="group block h-full"
                      to={`/teams/${perm.teamId}/settings` as string}
                    >
                      <Card className="relative flex h-full flex-col overflow-hidden border border-border/50 bg-card/60 backdrop-blur-xl transition-colors hover:border-border">
                        <CardContent className="relative z-10 flex h-full flex-col gap-6 p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                              <Briefcase className="h-6 w-6" />
                            </div>
                            <Badge
                              className={`font-bold text-[10px] uppercase tracking-widest ${perm.role === "ADMIN" ? "border-0 shadow-none" : "border-border/50 bg-muted text-muted-foreground"}`}
                              variant={
                                perm.role === "ADMIN" ? "default" : "secondary"
                              }
                            >
                              {perm.role}
                            </Badge>
                          </div>

                          <div className="flex-grow space-y-2">
                            <h3 className="line-clamp-2 font-black text-foreground text-xl tracking-tight">
                              {perm.teamName}
                            </h3>
                            <div className="flex w-fit items-center gap-1.5 rounded-md border border-border/50 bg-muted/50 px-2 py-1 font-bold font-mono text-[11px] text-muted-foreground/70">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                              WKS-{perm.teamId.slice(0, 6).toUpperCase()}
                            </div>
                          </div>

                          <div className="mt-auto flex items-center border-border/50 border-t pt-4 font-bold text-muted-foreground text-sm">
                            Manage workspace
                            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
