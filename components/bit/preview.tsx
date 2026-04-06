"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, DollarSign, TrendingUp, TrendingDown, FileText } from "lucide-react";
import type { TrialBalanceReport } from "@/types";

interface BITDataPreviewProps {
  trialBalance: TrialBalanceReport;
  organizationName: string;
  organizationTPN?: string;
  gstRegistered?: boolean;
}

export function BITDataPreview({
  trialBalance,
  organizationName,
  organizationTPN,
  gstRegistered,
}: BITDataPreviewProps) {
  // Calculate totals for preview
  const assets = trialBalance.accounts.filter(acc => acc.accountType === "asset");
  const liabilities = trialBalance.accounts.filter(acc => acc.accountType === "liability");
  const equity = trialBalance.accounts.filter(acc => acc.accountType === "equity");
  const revenue = trialBalance.accounts.filter(acc => acc.accountType === "revenue");
  const expenses = trialBalance.accounts.filter(acc => acc.accountType === "expense");

  const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
  const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);
  const totalRevenue = revenue.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
  const totalExpenses = expenses.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
  const netIncome = totalRevenue - totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BT", {
      style: "currency",
      currency: "BTN",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAssets)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {assets.length} asset accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalLiabilities)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {liabilities.length} liability accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {revenue.length} revenue accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            {netIncome >= 0 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(Math.abs(netIncome))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {netIncome >= 0 ? "Profit" : "Loss"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="trial-balance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Trial Balance Tab */}
        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trial Balance</CardTitle>
              <CardDescription>
                As of {new Date(trialBalance.asOfDate).toLocaleDateString("en-BT")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialBalance.accounts.map((account) => (
                      <TableRow key={account.accountId}>
                        <TableCell className="font-medium">{account.accountCode}</TableCell>
                        <TableCell>{account.accountName}</TableCell>
                        <TableCell className="text-right">
                          {account.debit !== 0 ? formatCurrency(account.debit) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {account.credit !== 0 ? formatCurrency(account.credit) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(account.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableBody>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={2} className="font-bold">
                        TOTALS
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(trialBalance.totalDebits)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(trialBalance.totalCredits)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {trialBalance.isBalanced ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Trial balance is balanced</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-muted-foreground">
                        Trial balance is not balanced
                      </span>
                    </>
                  )}
                </div>
                <Badge variant={trialBalance.isBalanced ? "default" : "destructive"}>
                  {trialBalance.isBalanced ? "Balanced" : "Not Balanced"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit & Loss Tab */}
        <TabsContent value="profit-loss" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statement of Profit and Loss</CardTitle>
              <CardDescription>
                For the period ended {new Date(trialBalance.asOfDate).toLocaleDateString("en-BT")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Revenue</h3>
                  <div className="space-y-2">
                    {revenue.map((account) => (
                      <div key={account.accountId} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-medium">{account.accountName}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({account.accountCode})
                          </span>
                        </div>
                        <span className="font-medium">{formatCurrency(Math.abs(account.balance))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-2 bg-muted/50 rounded px-3 mt-2">
                      <span className="font-bold">Total Revenue</span>
                      <span className="font-bold text-green-600">{formatCurrency(totalRevenue)}</span>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Expenses</h3>
                  <div className="space-y-2">
                    {expenses.map((account) => (
                      <div key={account.accountId} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-medium">{account.accountName}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({account.accountCode})
                          </span>
                        </div>
                        <span className="font-medium">{formatCurrency(Math.abs(account.balance))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-2 bg-muted/50 rounded px-3 mt-2">
                      <span className="font-bold">Total Expenses</span>
                      <span className="font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Income */}
                <div className="border-t-2 pt-4">
                  <div className="flex justify-between items-center py-3 bg-primary/10 rounded px-4">
                    <span className="text-lg font-bold">Net Profit/Loss</span>
                    <span className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(Math.abs(netIncome))}
                    </span>
                  </div>
                  <div className="text-center mt-2">
                    <Badge variant={netIncome >= 0 ? "default" : "destructive"} className="text-base px-4 py-1">
                      {netIncome >= 0 ? "PROFIT" : "LOSS"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet Tab */}
        <TabsContent value="balance-sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>
                As of {new Date(trialBalance.asOfDate).toLocaleDateString("en-BT")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Assets Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Assets</h3>
                  <div className="space-y-2">
                    {assets.map((account) => (
                      <div key={account.accountId} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-medium">{account.accountName}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({account.accountCode})
                          </span>
                        </div>
                        <span className="font-medium">{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-2 bg-muted/50 rounded px-3 mt-2">
                      <span className="font-bold">Total Assets</span>
                      <span className="font-bold">{formatCurrency(totalAssets)}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Liabilities</h3>
                  <div className="space-y-2">
                    {liabilities.map((account) => (
                      <div key={account.accountId} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-medium">{account.accountName}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({account.accountCode})
                          </span>
                        </div>
                        <span className="font-medium">{formatCurrency(Math.abs(account.balance))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-2 bg-muted/50 rounded px-3 mt-2">
                      <span className="font-bold">Total Liabilities</span>
                      <span className="font-bold">{formatCurrency(totalLiabilities)}</span>
                    </div>
                  </div>
                </div>

                {/* Equity Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Equity</h3>
                  <div className="space-y-2">
                    {equity.map((account) => (
                      <div key={account.accountId} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-medium">{account.accountName}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({account.accountCode})
                          </span>
                        </div>
                        <span className="font-medium">{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-2 bg-muted/50 rounded px-3 mt-2">
                      <span className="font-bold">Total Equity</span>
                      <span className="font-bold">{formatCurrency(totalEquity)}</span>
                    </div>
                  </div>
                </div>

                {/* Balance Check */}
                <div className="border-t-2 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/10 rounded p-4">
                      <div className="text-sm text-muted-foreground">Net Assets</div>
                      <div className="text-2xl font-bold">{formatCurrency(totalAssets - totalLiabilities)}</div>
                    </div>
                    <div className="bg-primary/10 rounded p-4">
                      <div className="text-sm text-muted-foreground">Total Equity</div>
                      <div className="text-2xl font-bold">{formatCurrency(totalEquity)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center mt-4 space-x-2">
                    {Math.abs((totalAssets - totalLiabilities) - totalEquity) < 0.01 ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-600">Balance Sheet is Balanced</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-600">Balance Sheet is Not Balanced</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Summary</CardTitle>
              <CardDescription>
                Overview of the BIT export data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Organization Info */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Organization Information
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Organization Name:</div>
                    <div>{organizationName}</div>
                    <div className="text-muted-foreground">Tax Payer Number (TPN):</div>
                    <div>{organizationTPN || "Not Set"}</div>
                    <div className="text-muted-foreground">GST Registered:</div>
                    <div>{gstRegistered ? "Yes" : "No"}</div>
                  </div>
                </div>

                {/* Account Summary */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Account Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Accounts</div>
                      <div className="text-lg font-semibold">{trialBalance.accounts.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Trial Balance Status</div>
                      <div className={`text-lg font-semibold ${trialBalance.isBalanced ? "text-green-600" : "text-red-600"}`}>
                        {trialBalance.isBalanced ? "Balanced" : "Not Balanced"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Financial Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Debits</div>
                      <div className="text-lg font-semibold">{formatCurrency(trialBalance.totalDebits)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Credits</div>
                      <div className="text-lg font-semibold">{formatCurrency(trialBalance.totalCredits)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Net Income</div>
                      <div className={`text-lg font-semibold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(Math.abs(netIncome))}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Assets</div>
                      <div className="text-lg font-semibold">{formatCurrency(totalAssets)}</div>
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                {!organizationTPN && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Missing Information</AlertTitle>
                    <AlertDescription>
                      Tax Payer Number (TPN) is not set. This is required for BIT export.
                    </AlertDescription>
                  </Alert>
                )}

                {trialBalance.accounts.filter(acc => acc.debit === 0 && acc.credit === 0).length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Zero Balance Accounts</AlertTitle>
                    <AlertDescription>
                      {trialBalance.accounts.filter(acc => acc.debit === 0 && acc.credit === 0).length} account(s) have zero balances.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}