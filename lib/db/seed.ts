import "dotenv/config";
import { db } from "./index";
import { accounts, organizations } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Default Chart of Accounts for New Zealand GST
 */
const defaultChartOfAccounts = [
  // Assets
  { code: "1000", name: "Current Assets", type: "asset" as const, level: 0 },
  { code: "1100", name: "Cash and Cash Equivalents", type: "asset" as const, level: 1 },
  { code: "1110", name: "Cash on Hand", type: "asset" as const, level: 2 },
  { code: "1120", name: "Bank Account", type: "asset" as const, level: 2 },
  { code: "1200", name: "Accounts Receivable", type: "asset" as const, level: 1 },
  { code: "1210", name: "Trade Debtors", type: "asset" as const, level: 2 },
  { code: "1300", name: "Inventory", type: "asset" as const, level: 1 },
  { code: "1310", name: "Raw Materials", type: "asset" as const, level: 2 },
  { code: "1320", name: "Work in Progress", type: "asset" as const, level: 2 },
  { code: "1330", name: "Finished Goods", type: "asset" as const, level: 2 },
  { code: "1500", name: "Fixed Assets", type: "asset" as const, level: 1 },
  { code: "1510", name: "Plant and Equipment", type: "asset" as const, level: 2 },
  { code: "1520", name: "Motor Vehicles", type: "asset" as const, level: 2 },
  { code: "1530", name: "Office Equipment", type: "asset" as const, level: 2 },
  { code: "1540", name: "Computer Equipment", type: "asset" as const, level: 2 },
  { code: "1600", name: "Accumulated Depreciation", type: "asset" as const, level: 1 },

  // Liabilities
  { code: "2000", name: "Current Liabilities", type: "liability" as const, level: 0 },
  { code: "2100", name: "Accounts Payable", type: "liability" as const, level: 1 },
  { code: "2110", name: "Trade Creditors", type: "liability" as const, level: 2 },
  { code: "2200", name: "GST Payable", type: "liability" as const, level: 1 },
  { code: "2210", name: "GST Collected", type: "liability" as const, level: 2 },
  { code: "2220", name: "GST Paid", type: "liability" as const, level: 2 },
  { code: "2300", name: "Accruals", type: "liability" as const, level: 1 },
  { code: "2400", name: "Provisions", type: "liability" as const, level: 1 },
  { code: "2500", name: "Short-term Loans", type: "liability" as const, level: 1 },
  { code: "2700", name: "Long-term Liabilities", type: "liability" as const, level: 1 },
  { code: "2710", name: "Bank Loans", type: "liability" as const, level: 2 },
  { code: "2720", name: "Hire Purchase", type: "liability" as const, level: 2 },

  // Equity
  { code: "3000", name: "Equity", type: "equity" as const, level: 0 },
  { code: "3100", name: "Owner's Equity", type: "equity" as const, level: 1 },
  { code: "3110", name: "Capital Introduced", type: "equity" as const, level: 2 },
  { code: "3120", name: "Drawings", type: "equity" as const, level: 2 },
  { code: "3200", name: "Retained Earnings", type: "equity" as const, level: 1 },
  { code: "3300", name: "Current Year Earnings", type: "equity" as const, level: 1 },

  // Revenue
  { code: "4000", name: "Revenue", type: "revenue" as const, level: 0 },
  { code: "4100", name: "Sales Revenue", type: "revenue" as const, level: 1 },
  { code: "4110", name: "Goods Sales", type: "revenue" as const, level: 2 },
  { code: "4120", name: "Services Revenue", type: "revenue" as const, level: 2 },
  { code: "4200", name: "Other Income", type: "revenue" as const, level: 1 },
  { code: "4210", name: "Interest Income", type: "revenue" as const, level: 2 },
  { code: "4220", name: "Dividend Income", type: "revenue" as const, level: 2 },
  { code: "4300", name: "GST Refunds", type: "revenue" as const, level: 1 },

  // Expenses
  { code: "5000", name: "Cost of Sales", type: "expense" as const, level: 0 },
  { code: "5100", name: "Cost of Goods Sold", type: "expense" as const, level: 1 },
  { code: "5200", name: "Purchases", type: "expense" as const, level: 1 },
  { code: "5300", name: "Direct Labour", type: "expense" as const, level: 1 },
  { code: "5400", name: "Freight and Cartage", type: "expense" as const, level: 1 },

  { code: "6000", name: "Operating Expenses", type: "expense" as const, level: 0 },
  { code: "6100", name: "Occupancy Expenses", type: "expense" as const, level: 1 },
  { code: "6110", name: "Rent", type: "expense" as const, level: 2 },
  { code: "6120", name: "Rates", type: "expense" as const, level: 2 },
  { code: "6130", name: "Power and Utilities", type: "expense" as const, level: 2 },

  { code: "6200", name: "Administrative Expenses", type: "expense" as const, level: 1 },
  { code: "6210", name: "Office Supplies", type: "expense" as const, level: 2 },
  { code: "6220", name: "Postage and Delivery", type: "expense" as const, level: 2 },
  { code: "6230", name: "Printing and Stationery", type: "expense" as const, level: 2 },
  { code: "6240", name: "Professional Fees", type: "expense" as const, level: 2 },
  { code: "6250", name: "Accounting Fees", type: "expense" as const, level: 2 },
  { code: "6260", name: "Legal Fees", type: "expense" as const, level: 2 },

  { code: "6300", name: "Sales and Marketing", type: "expense" as const, level: 1 },
  { code: "6310", name: "Advertising", type: "expense" as const, level: 2 },
  { code: "6320", name: "Marketing Expenses", type: "expense" as const, level: 2 },
  { code: "6330", name: "Entertainment", type: "expense" as const, level: 2 },

  { code: "6400", name: "Vehicle Expenses", type: "expense" as const, level: 1 },
  { code: "6410", name: "Fuel and Oil", type: "expense" as const, level: 2 },
  { code: "6420", name: "Vehicle Maintenance", type: "expense" as const, level: 2 },
  { code: "6430", name: "Vehicle Insurance", type: "expense" as const, level: 2 },
  { code: "6440", name: "Registration and Licensing", type: "expense" as const, level: 2 },

  { code: "6500", name: "Travel Expenses", type: "expense" as const, level: 1 },
  { code: "6510", name: "Accommodation", type: "expense" as const, level: 2 },
  { code: "6520", name: "Meals", type: "expense" as const, level: 2 },
  { code: "6530", name: "Airfares", type: "expense" as const, level: 2 },

  { code: "6600", name: "Personnel Expenses", type: "expense" as const, level: 1 },
  { code: "6610", name: "Wages and Salaries", type: "expense" as const, level: 2 },
  { code: "6620", name: "Superannuation", type: "expense" as const, level: 2 },
  { code: "6630", name: "Payroll Tax", type: "expense" as const, level: 2 },

  { code: "6700", name: "Financial Expenses", type: "expense" as const, level: 1 },
  { code: "6710", name: "Bank Charges", type: "expense" as const, level: 2 },
  { code: "6720", name: "Interest Expense", type: "expense" as const, level: 2 },
  { code: "6730", name: "Bad Debts", type: "expense" as const, level: 2 },

  { code: "6800", name: "Depreciation", type: "expense" as const, level: 1 },
  { code: "6810", name: "Plant and Equipment Depreciation", type: "expense" as const, level: 2 },
  { code: "6820", name: "Vehicle Depreciation", type: "expense" as const, level: 2 },
  { code: "6830", name: "Computer Equipment Depreciation", type: "expense" as const, level: 2 },

  { code: "6900", name: "Other Expenses", type: "expense" as const, level: 1 },
  { code: "6910", name: "Insurance", type: "expense" as const, level: 2 },
  { code: "6920", name: "Repairs and Maintenance", type: "expense" as const, level: 2 },
  { code: "6930", name: "Telecommunications", type: "expense" as const, level: 2 },
  { code: "6940", name: "Internet", type: "expense" as const, level: 2 },
];

/**
 * Seed default chart of accounts for an organization
 */
export async function seedChartOfAccounts(organizationId: string) {
  try {
    // Check if organization already has accounts
    const existingAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.organizationId, organizationId));

    if (existingAccounts.length > 0) {
      console.log("Organization already has chart of accounts");
      return { success: true, message: "Chart of accounts already exists" };
    }

    // Build account hierarchy map
    const accountMap = new Map<string, string>();

    // First pass: create all accounts
    for (const accountData of defaultChartOfAccounts) {
      const [account] = await db
        .insert(accounts)
        .values({
          organizationId,
          code: accountData.code,
          name: accountData.name,
          type: accountData.type,
          level: accountData.level,
          balance: "0",
          isActive: true,
          isSystem: true,
        })
        .returning();

      accountMap.set(accountData.code, account.id);
    }

    // Second pass: set parent relationships
    for (const accountData of defaultChartOfAccounts) {
      if (accountData.level > 0) {
        // Find parent by stripping last digit
        const parentCode = accountData.code.slice(0, -1) + "0";
        const accountId = accountMap.get(accountData.code);
        const parentId = accountMap.get(parentCode);

        if (accountId && parentId) {
          await db
            .update(accounts)
            .set({ parentId })
            .where(eq(accounts.id, accountId));
        }
      }
    }

    return { success: true, message: "Chart of accounts seeded successfully" };
  } catch (error) {
    console.error("Error seeding chart of accounts:", error);
    return { success: false, message: "Failed to seed chart of accounts" };
  }
}

/**
 * Seed organization with initial data
 */
export async function seedOrganization(organizationId: string) {
  const result = await seedChartOfAccounts(organizationId);
  return result;
}

/**
 * Create a sample organization (for development)
 */
export async function createSampleOrganization() {
  try {
    const [org] = await db
      .insert(organizations)
      .values({
        clerkOrgId: "org_sample_" + Date.now(),
        name: "Sample Organization",
        tpn: "123456789",
        gstRegistered: true,
        gstRate: "15",
        fiscalYearEnd: "03-31",
        settings: {
          currency: "NZD",
          dateFormat: "DD/MM/YYYY",
          timezone: "Pacific/Auckland",
        },
      })
      .returning();

    // Seed chart of accounts
    await seedChartOfAccounts(org.id);

    return { success: true, organization: org };
  } catch (error) {
    console.error("Error creating sample organization:", error);
    return { success: false, error };
  }
}

async function main() {
  console.log("🌱 Seeding database...");
  try {
    const result = await createSampleOrganization();
    if (result.success) {
      console.log("✅ Database seeded successfully!");
      console.log("Org ID:", result.organization?.id);
      console.log("Clerk Org ID:", result.organization?.clerkOrgId);
      process.exit(0);
    } else {
      console.error("❌ Seeding failed:", result.error);
      process.exit(1);
    }
  } catch (err) {
    console.error("Fatal error during seeding:", err);
    process.exit(1);
  }
}

// Call main if run directly
if (process.argv[1] && (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed"))) {
  main().catch((err) => {
    console.error("Fatal error during seeding:", err);
    process.exit(1);
  });
}