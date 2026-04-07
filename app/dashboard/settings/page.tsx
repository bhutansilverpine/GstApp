import { getCurrentOrganizationId } from "@/server";
import { db, organizations, accounts } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const organizationId = await getCurrentOrganizationId();
  
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  const allAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.organizationId, organizationId))
    .orderBy(asc(accounts.code));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings and chart of accounts
        </p>
      </div>

      <Tabs defaultValue="organization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Update your business information for tax reporting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input id="name" defaultValue={org?.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tpn">TPN (Taxpayer Number)</Label>
                  <Input id="tpn" defaultValue={org?.tpn || ""} placeholder="11-digit TPN" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstRate">Default GST Rate (%)</Label>
                  <Input id="gstRate" defaultValue={org?.gstRate || "15"} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Base Currency</Label>
                  <Input id="currency" defaultValue={org?.settings?.currency || "BTN"} disabled />
                </div>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Chart of Accounts</CardTitle>
                <CardDescription>
                  Review and manage your accounting codes
                </CardDescription>
              </div>
              <Button size="sm">Add Account</Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border text-sm">
                <div className="grid grid-cols-4 bg-muted/50 p-2 font-medium border-b">
                  <div>Code</div>
                  <div>Name</div>
                  <div>Type</div>
                  <div>Status</div>
                </div>
                <div className="divide-y overflow-y-auto max-h-[500px]">
                  {allAccounts.map((acc) => (
                    <div key={acc.id} className="grid grid-cols-4 p-2 items-center">
                      <div className="font-mono text-xs">{acc.code}</div>
                      <div>{acc.name}</div>
                      <div className="capitalize">{acc.type}</div>
                      <div>
                        <Badge variant={acc.isActive ? "default" : "secondary"}>
                          {acc.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Invite and manage users in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-8 text-center italic">
                User management is handled through Clerk Organizations.
              </p>
              <div className="flex justify-center">
                <Button variant="outline">Open Team Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
