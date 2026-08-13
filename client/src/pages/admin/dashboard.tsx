import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useOrganizers, useCreateOrganizer, useUpdateOrganizerStatus, useDeleteOrganizer, useOrganizerApplications, useApproveOrganizerApplication, useRejectOrganizerApplication, useResetOrganizerPassword } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus, Building, MoreVertical, Trash, Pause, Play, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminDashboard() {
  const { data: organizers, isLoading } = useOrganizers();
  const createOrg = useCreateOrganizer();
  const updateStatus = useUpdateOrganizerStatus();
  const deleteOrg = useDeleteOrganizer();
  const { data: applications, isLoading: appsLoading } = useOrganizerApplications();
  const approveApp = useApproveOrganizerApplication();
  const rejectApp = useRejectOrganizerApplication();
  const resetPw = useResetOrganizerPassword();
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOrg.mutateAsync(formData);
    setIsOpen(false);
    setFormData({ name: "", email: "", password: "" });
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Organizers</h2>
          <p className="text-muted-foreground mt-1">Manage event organizers on the platform.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="hover-elevate gap-2">
              <Plus className="w-4 h-4" /> Add Organizer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Organizer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Company/Organizer Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Temporary Password</Label>
                <Input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <Button type="submit" className="w-full" disabled={createOrg.isPending}>
                {createOrg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-display font-bold">Pending Organizer Applications</h3>
          <p className="text-muted-foreground">Review new organizer signups and approve or reject.</p>
        </div>
        {appsLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : !applications || applications.length === 0 ? (
          <div className="p-6 text-muted-foreground">No pending applications.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">Submitted</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((app: any) => (
                  <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{app.name}</td>
                    <td className="px-6 py-4">{app.email}</td>
                    <td className="px-6 py-4">{app.company}</td>
                    <td className="px-6 py-4 text-muted-foreground">{format(new Date(app.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          onClick={() => approveApp.mutate(app.id)}
                          disabled={approveApp.isPending}
                          aria-label="Approve application"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => {
                            const reason = prompt("Optional rejection reason:");
                            rejectApp.mutate({ id: app.id, reason: reason || undefined });
                          }}
                          disabled={rejectApp.isPending}
                          aria-label="Reject application"
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : organizers?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No organizers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Organizer Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {organizers?.map((row: any) => (
                  <tr key={row.organizer.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{row.organizer.name}</td>
                    <td className="px-6 py-4">{row.user.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={row.organizer.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {row.organizer.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(row.organizer.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const pw = prompt("Enter a new temporary password:");
                            if (pw) {
                              resetPw.mutate({ id: row.organizer.id, newPassword: pw });
                            }
                          }}
                          aria-label="Reset password"
                        >
                          Reset Password
                        </Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => updateStatus.mutate({ 
                              id: row.organizer.id, 
                              status: row.organizer.status === 'active' ? 'paused' : 'active' 
                            })}
                          >
                            {row.organizer.status === 'active' ? (
                              <><Pause className="w-4 h-4 mr-2" /> Pause Account</>
                            ) : (
                              <><Play className="w-4 h-4 mr-2" /> Activate Account</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this organizer?")) {
                                deleteOrg.mutate(row.organizer.id);
                              }
                            }}
                          >
                            <Trash className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const pw = prompt("Enter a new temporary password:");
                              if (pw) {
                                resetPw.mutate({ id: row.organizer.id, newPassword: pw });
                              }
                            }}
                          >
                            Reset Password
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
