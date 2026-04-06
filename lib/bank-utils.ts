/**
 * Shared utility functions for bank transaction processing and categorization.
 * These are synchronous functions that can be used on both client and server.
 */

interface CategorizationRule {
  keywords: string[];
  category: string;
  priority: number;
}

const CATEGORIZATION_RULES: CategorizationRule[] = [
  {
    keywords: ["LUNGYEN", "DAMCHEN", "PUMP", "PETROL", "FUEL STATION"],
    category: "FUEL",
    priority: 10,
  },
  {
    keywords: ["RESTAURANT", "CAFE", "HOTEL", "BAKERY", "ZOMATO", "FOOD"],
    category: "FOOD",
    priority: 9,
  },
  {
    keywords: ["PHARMACY", "HOSPITAL", "CLINIC", "MEDICAL", "DOCTOR"],
    category: "HEALTH",
    priority: 8,
  },
  {
    keywords: ["SCHOOL", "COLLEGE", "EDUCATION", "TUITION"],
    category: "EDUCATION",
    priority: 7,
  },
  {
    keywords: ["MALL", "MART", "STORE", "SHOP", "SUPERMARKET", "GROCERY"],
    category: "SHOPPING",
    priority: 5,
  },
  {
    keywords: ["TASHI", "BTL", "RECHARGE", "BILL", "RICB", "POWER", "ELECTRIC"],
    category: "UTILITY",
    priority: 5,
  },
  {
    keywords: ["TAXI", "CAB", "BUS", "TRAVEL", "TRANSPORT"],
    category: "TRANSPORT",
    priority: 5,
  },
  {
    keywords: ["OFFICE", "SUPPLY", "STATIONERY", "PRINT", "XEROX"],
    category: "OFFICE SUPPLIES",
    priority: 4,
  },
  {
    keywords: ["GPAY", "MBANK", "QR-PAY", "UPI"],
    category: "DIGITAL PAYMENT",
    priority: 2,
  },
  {
    keywords: ["ATM", "CASH"],
    category: "CASH WITHDRAWAL",
    priority: 2,
  },
  {
    keywords: ["TRANSFER", "NEFT", "RTGS", "IMPS"],
    category: "BANK TRANSFER",
    priority: 2,
  },
];

const PAYMENT_MODES: { [key: string]: string } = {
  GPAY: "GPAY",
  "M-BOB": "M-BOB",
  MBANK: "M-BOB",
  NQRC: "QR-PAY",
  UPI: "UPI",
  ATM: "CASH",
  POS: "CARD",
  "BT-POS": "CARD",
  INDO: "INDO-TRANS",
  CHEQUE: "CHEQUE",
};

export function categorizeTransaction(description: string): string {
  const upperDesc = description.toUpperCase();
  const sortedRules = [...CATEGORIZATION_RULES].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    for (const keyword of rule.keywords) {
      if (upperDesc.includes(keyword)) {
        return rule.category;
      }
    }
  }

  return "MISC/PERSONAL";
}

export function extractPaymentMode(description: string): string {
  const upperDesc = description.toUpperCase();
  for (const [key, value] of Object.entries(PAYMENT_MODES)) {
    if (upperDesc.includes(key)) {
      return value;
    }
  }
  return "OTHER";
}

export function extractAccountNumber(description: string): string {
  const match = description.match(/\d{8,12}/);
  return match ? match[0] : "";
}

export function extractMerchantName(description: string): string {
  let merchant = description.toUpperCase();
  const removalPatterns = [
    "OUTGOING PAYMENT VIA", "INCOMING PAYMENT VIA", "TRANSFER FROM",
    "TRANSFER TO", "BY", "FROM", "TO", "NEFT", "RTGS", "IMPS", "RRN",
    "REF", "REFERENCE",
  ];

  removalPatterns.forEach((pattern) => {
    merchant = merchant.replace(new RegExp(pattern, "gi"), "");
  });

  merchant = merchant.replace(/\d{8,12}/g, "");
  merchant = merchant.replace(/[|,\-]/g, " ").replace(/\s+/g, " ").trim();
  return merchant.substring(0, 40);
}

export function getCategorySuggestions(
  description: string
): Array<{ category: string; confidence: number }> {
  const upperDesc = description.toUpperCase();
  const suggestions: Array<{ category: string; confidence: number }> = [];
  const sortedRules = [...CATEGORIZATION_RULES].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    let matchCount = 0;
    for (const keyword of rule.keywords) {
      if (upperDesc.includes(keyword)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      const confidence = Math.min(matchCount / rule.keywords.length, 1);
      suggestions.push({
        category: rule.category,
        confidence: confidence * rule.priority * 0.1,
      });
    }
  }

  suggestions.sort((a, b) => b.confidence - a.confidence);
  return suggestions.slice(0, 5);
}
