"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileSpreadsheet, CheckCircle, AlertCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateBITExport, validateBITExport } from "@/server/bit/export";
import type { BITExportInput } from "@/server/bit/export";

interface BITExportWizardProps {
  organizationId: string;
  organizationName: string;
  organizationTPN?: string;
}

type WizardStep = "year-selection" | "validation" | "options" | "export" | "complete";

export function BITExportWizard({
  organizationId,
  organizationName,
  organizationTPN,
}: BITExportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("year-selection");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    canProceed: boolean;
  } | null>(null);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    fileName?: string;
    fileSize?: number;
    error?: string;
  } | null>(null);

  // Form state
  const [financialYear, setFinancialYear] = useState({
    type: "custom",
    year: new Date().getFullYear(),
    startDate: "",
    endDate: "",
  });

  const [exportOptions, setExportOptions] = useState({
    includeTrialBalance: true,
    includeProfitLoss: true,
    includeBalanceSheet: true,
    includeGSTReconciliation: true,
    includeDepreciationSchedule: true,
    includeCompanyInfo: true,
  });

  const { toast } = useToast();

  // Handle year type change
  const handleYearTypeChange = (type: string) => {
    setFinancialYear(prev => ({
      ...prev,
      type,
    }));

    if (type === "fy-current") {
      const currentYear = new Date().getFullYear();
      setFinancialYear({
        type: "fy-current",
        year: currentYear,
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
      });
    } else if (type === "fy-previous") {
      const previousYear = new Date().getFullYear() - 1;
      setFinancialYear({
        type: "fy-previous",
        year: previousYear,
        startDate: `${previousYear}-01-01`,
        endDate: `${previousYear}-12-31`,
      });
    }
  };

  // Validate and proceed
  const handleValidate = async () => {
    if (!financialYear.startDate || !financialYear.endDate) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select both start and end dates for the financial year.",
      });
      return;
    }

    setIsLoading(true);
    setProgress(10);

    try {
      const input: BITExportInput = {
        organizationId,
        financialYearStart: new Date(financialYear.startDate),
        financialYearEnd: new Date(financialYear.endDate),
        includeDraftTransactions: false,
        exportOptions,
      };

      setProgress(30);

      const result = await validateBITExport(input);
      setValidationResult(result);
      setProgress(100);

      if (result.canProceed) {
        toast({
          title: "Validation Complete",
          description: "Your data is ready for BIT export.",
        });
        setCurrentStep("options");
      } else {
        toast({
          variant: "destructive",
          title: "Validation Issues Found",
          description: `${result.errors.length} error(s) need to be resolved before export.`,
        });
        setCurrentStep("validation");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Failed to validate data",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  // Generate export
  const handleExport = async () => {
    if (!financialYear.startDate || !financialYear.endDate) {
      toast({
        variant: "destructive",
        title: "Export Error",
        description: "Please select both start and end dates for the financial year.",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      const input: BITExportInput = {
        organizationId,
        financialYearStart: new Date(financialYear.startDate),
        financialYearEnd: new Date(financialYear.endDate),
        includeDraftTransactions: false,
        exportOptions,
      };

      setProgress(20);
      const result = await generateBITExport(input);
      setProgress(90);

      setExportResult(result);

      if (result.success) {
        setProgress(100);
        toast({
          title: "Export Successful",
          description: `BIT export has been generated: ${result.fileName}`,
        });
        setCurrentStep("complete");
      } else {
        toast({
          variant: "destructive",
          title: "Export Failed",
          description: result.error || "Failed to generate BIT export",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Error",
        description: error instanceof Error ? error.message : "Failed to generate export",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  // Reset wizard
  const handleReset = () => {
    setCurrentStep("year-selection");
    setValidationResult(null);
    setExportResult(null);
    setProgress(0);
  };

  // Download file (placeholder)
  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "Your BIT export is being downloaded...",
    });
    // In a real implementation, this would trigger the file download
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <Card>
        <CardHeader>
          <CardTitle>BIT Export Wizard</CardTitle>
          <CardDescription>
            Generate Bhutan Business Income Tax compliant Excel exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep === "year-selection" ? 1 : currentStep === "validation" ? 2 : currentStep === "options" ? 3 : 4} of 4</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Year Selection */}
      {currentStep === "year-selection" && (
        <Card>
          <CardHeader>
            <CardTitle>Select Financial Year</CardTitle>
            <CardDescription>
              Choose the financial year period for the BIT export
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Financial Year Type</Label>
              <Select
                value={financialYear.type}
                onValueChange={handleYearTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fy-current">Current Financial Year</SelectItem>
                  <SelectItem value="fy-previous">Previous Financial Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={financialYear.startDate}
                  onChange={(e) => setFinancialYear(prev => ({ ...prev, startDate: e.target.value }))}
                  disabled={financialYear.type !== "custom"}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={financialYear.endDate}
                  onChange={(e) => setFinancialYear(prev => ({ ...prev, endDate: e.target.value }))}
                  disabled={financialYear.type !== "custom"}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleValidate} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Validate & Continue"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Validation Results */}
      {currentStep === "validation" && validationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>
              Review validation issues before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Errors Found</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validationResult.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validationResult.canProceed && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Ready for Export</AlertTitle>
                <AlertDescription>
                  Your data has been validated and is ready for BIT export.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Back
              </Button>
              {validationResult.canProceed && (
                <Button onClick={() => setCurrentStep("options")}>
                  Continue to Options
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Export Options */}
      {currentStep === "options" && (
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
            <CardDescription>
              Choose which sections to include in the BIT export
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-company-info"
                  checked={exportOptions.includeCompanyInfo}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeCompanyInfo: checked as boolean }))
                  }
                />
                <Label htmlFor="include-company-info">Include Company Information</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-trial-balance"
                  checked={exportOptions.includeTrialBalance}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeTrialBalance: checked as boolean }))
                  }
                />
                <Label htmlFor="include-trial-balance">Include Trial Balance</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-profit-loss"
                  checked={exportOptions.includeProfitLoss}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeProfitLoss: checked as boolean }))
                  }
                />
                <Label htmlFor="include-profit-loss">Include Profit & Loss Statement</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-balance-sheet"
                  checked={exportOptions.includeBalanceSheet}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeBalanceSheet: checked as boolean }))
                  }
                />
                <Label htmlFor="include-balance-sheet">Include Balance Sheet</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-gst-reconciliation"
                  checked={exportOptions.includeGSTReconciliation}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeGSTReconciliation: checked as boolean }))
                  }
                />
                <Label htmlFor="include-gst-reconciliation">Include GST Reconciliation</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-depreciation"
                  checked={exportOptions.includeDepreciationSchedule}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeDepreciationSchedule: checked as boolean }))
                  }
                />
                <Label htmlFor="include-depreciation">Include Depreciation Schedule</Label>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("year-selection")}>
                Back
              </Button>
              <Button onClick={handleExport} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Export...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Generate Export
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {currentStep === "complete" && exportResult?.success && (
        <Card>
          <CardHeader>
            <CardTitle>Export Complete</CardTitle>
            <CardDescription>
              Your BIT export has been generated successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your BIT export has been generated and is ready for download.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">File Name:</span>
                <span className="font-medium">{exportResult.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">File Size:</span>
                <span className="font-medium">{(exportResult.fileSize! / 1024).toFixed(2)} KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization:</span>
                <span className="font-medium">{organizationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TPN:</span>
                <span className="font-medium">{organizationTPN || "Not Set"}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Create Another Export
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Export
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}