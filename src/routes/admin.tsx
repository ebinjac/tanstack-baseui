import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const location = useLocation()

  // Simple logic to determine breadcrumbs based on path
  const isRequests = location.pathname.includes('/requests')
  const isTeams = location.pathname.includes('/teams')

  let pageName = 'Dashboard'
  if (isRequests) pageName = 'Team Requests'
  if (isTeams) pageName = 'Teams'

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link to="/admin" />}>Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
              Administrator View
            </div>
          </div>
        </header>

        <main className="p-6 space-y-8 mx-auto w-full">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
