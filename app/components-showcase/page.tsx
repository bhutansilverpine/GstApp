import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { MetricCard } from "@/components/dashboard/metric-card"
import { GlassCard, StatCard } from "@/components/dashboard/glass-card"
import { Breadcrumb } from "@/components/dashboard/breadcrumb"
import { DollarSign, Users, FileText, TrendingUp } from "lucide-react"

export default function ComponentsShowcase() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">UI Components Showcase</h1>
          <p className="text-muted-foreground mt-2">
            Premium UI components inspired by Clerk.com and Supabase.com
          </p>
        </div>

        <div className="space-y-12">
          {/* Buttons */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                  <Button size="sm">Small</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Form Elements */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Form Elements</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Type your message here" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Cards */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Cards</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description goes here</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Card content with example text and information.</p>
                </CardContent>
              </Card>
              <GlassCard title="Glass Card" description="With glassmorphism effect">
                <p>This card has a beautiful glass effect backdrop.</p>
              </GlassCard>
              <StatCard
                title="Total Revenue"
                value="₹45,231.89"
                change={20.1}
                trend="up"
                icon={<DollarSign className="h-5 w-5" />}
              />
            </div>
          </section>

          {/* Metric Cards */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Metric Cards</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Revenue"
                value="₹45,231.89"
                change={20.1}
                changeType="increase"
                trend="up"
                icon={<DollarSign className="h-4 w-4" />}
                description="From last month"
              />
              <MetricCard
                title="Active Users"
                value="1,234"
                change={8.2}
                changeType="increase"
                trend="up"
                icon={<Users className="h-4 w-4" />}
                description="From last month"
              />
              <MetricCard
                title="Documents"
                value="245"
                change={15.3}
                changeType="increase"
                trend="up"
                icon={<FileText className="h-4 w-4" />}
                description="From last month"
              />
              <MetricCard
                title="Growth Rate"
                value="12.5%"
                change={-2.4}
                changeType="decrease"
                trend="down"
                icon={<TrendingUp className="h-4 w-4" />}
                description="From last month"
              />
            </div>
          </section>

          {/* Badges & Avatars */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Badges & Avatars</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
                <Separator />
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src="/avatars/user1.png" alt="User" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarImage src="/avatars/user2.png" alt="User" />
                    <AvatarFallback>AB</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      XY
                    </AvatarFallback>
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Progress */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Progress</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Project Progress</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Upload Status</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Task Completion</span>
                    <span>90%</span>
                  </div>
                  <Progress value={90} />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Tables */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Tables</h2>
            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">INV001</TableCell>
                      <TableCell>Acme Corp</TableCell>
                      <TableCell>2024-01-15</TableCell>
                      <TableCell className="text-right">₹2,500.00</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="success">Paid</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">INV002</TableCell>
                      <TableCell>Startup Inc</TableCell>
                      <TableCell>2024-01-18</TableCell>
                      <TableCell className="text-right">₹1,800.00</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="warning">Pending</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">INV003</TableCell>
                      <TableCell>Tech Solutions</TableCell>
                      <TableCell>2024-01-20</TableCell>
                      <TableCell className="text-right">₹3,200.00</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">Overdue</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* Tabs */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Tabs</h2>
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="account">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  <TabsContent value="account">
                    <p className="text-sm text-muted-foreground">
                      Make changes to your account here. Click save when you're done.
                    </p>
                  </TabsContent>
                  <TabsContent value="password">
                    <p className="text-sm text-muted-foreground">
                      Change your password here. After saving, you'll be logged out.
                    </p>
                  </TabsContent>
                  <TabsContent value="settings">
                    <p className="text-sm text-muted-foreground">
                      Manage your account settings and set e-mail preferences.
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>

          {/* Breadcrumb */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Breadcrumb</h2>
            <Card>
              <CardContent className="p-6">
                <Breadcrumb
                  items={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Components", href: "/components" },
                    { label: "Showcase" },
                  ]}
                />
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
