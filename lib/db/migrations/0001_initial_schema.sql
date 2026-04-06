-- Initial Schema Migration for Silverpine Ledger
-- This migration creates the core database structure for multi-tenant GST accounting

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE account_type AS ENUM (
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense'
);

CREATE TYPE journal_type AS ENUM (
  'general',
  'sales',
  'purchase',
  'receipt',
  'payment',
  'adjustment',
  'opening'
);

CREATE TYPE receipt_status AS ENUM (
  'pending',
  'verified',
  'rejected',
  'flagged'
);

CREATE TYPE bank_transaction_status AS ENUM (
  'unreconciled',
  'reconciled',
  'flagged'
);

-- Organizations table (multi-tenancy)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tpn VARCHAR(50) UNIQUE,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  gst_registered BOOLEAN DEFAULT true,
  gst_rate DECIMAL(5,2) DEFAULT 15.00,
  fiscal_year_end VARCHAR(20) DEFAULT '03-31',
  logo TEXT,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for organizations
CREATE INDEX organizations_clerk_org_id_idx ON organizations(clerk_org_id);
CREATE INDEX organizations_tpn_idx ON organizations(tpn);

-- Accounts (Chart of Accounts)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type account_type NOT NULL,
  description TEXT,
  balance DECIMAL(15,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  level INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(organization_id, code)
);

-- Create indexes for accounts
CREATE INDEX accounts_organization_id_idx ON accounts(organization_id);
CREATE INDEX accounts_parent_id_idx ON accounts(parent_id);
CREATE INDEX accounts_code_idx ON accounts(code);
CREATE INDEX accounts_type_idx ON accounts(type);

-- Transactions (Journal Entries)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT NOT NULL,
  reference VARCHAR(255),
  type journal_type DEFAULT 'general',
  is_posted BOOLEAN DEFAULT false,
  is_reconciled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255)
);

-- Create indexes for transactions
CREATE INDEX transactions_organization_id_idx ON transactions(organization_id);
CREATE INDEX transactions_date_idx ON transactions(date);
CREATE INDEX transactions_type_idx ON transactions(type);
CREATE INDEX transactions_reference_idx ON transactions(reference);

-- Transaction Lines (Debit/Credit entries)
CREATE TABLE transaction_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  description TEXT,
  debit DECIMAL(15,2) DEFAULT 0.00,
  credit DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for transaction_lines
CREATE INDEX transaction_lines_transaction_id_idx ON transaction_lines(transaction_id);
CREATE INDEX transaction_lines_account_id_idx ON transaction_lines(account_id);
CREATE INDEX transaction_lines_transaction_account_idx ON transaction_lines(transaction_id, account_id);

-- Receipts (AI-extracted from documents)
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_name VARCHAR(255),
  vendor_tpn VARCHAR(50),
  vendor_gst_number VARCHAR(50),
  date TIMESTAMP WITH TIME ZONE,
  subtotal DECIMAL(15,2) DEFAULT 0.00,
  gst_amount DECIMAL(15,2) DEFAULT 0.00,
  total_amount DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'NZD',
  category VARCHAR(255),
  description TEXT,
  image_url TEXT,
  document_url TEXT,
  status receipt_status DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by VARCHAR(255),
  notes TEXT,
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for receipts
CREATE INDEX receipts_organization_id_idx ON receipts(organization_id);
CREATE INDEX receipts_date_idx ON receipts(date);
CREATE INDEX receipts_status_idx ON receipts(status);
CREATE INDEX receipts_vendor_tpn_idx ON receipts(vendor_tpn);

-- Bank Transactions
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bank_account_id UUID,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT NOT NULL,
  reference VARCHAR(255),
  amount DECIMAL(15,2) NOT NULL,
  balance DECIMAL(15,2),
  transaction_type VARCHAR(50) NOT NULL,
  status bank_transaction_status DEFAULT 'unreconciled',
  category_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for bank_transactions
CREATE INDEX bank_transactions_organization_id_idx ON bank_transactions(organization_id);
CREATE INDEX bank_transactions_bank_account_id_idx ON bank_transactions(bank_account_id);
CREATE INDEX bank_transactions_date_idx ON bank_transactions(date);
CREATE INDEX bank_transactions_status_idx ON bank_transactions(status);
CREATE INDEX bank_transactions_transaction_id_idx ON bank_transactions(transaction_id);
CREATE INDEX bank_transactions_receipt_id_idx ON bank_transactions(receipt_id);
CREATE INDEX bank_transactions_category_id_idx ON bank_transactions(category_id);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_lines_updated_at BEFORE UPDATE ON transaction_lines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_transactions_updated_at BEFORE UPDATE ON bank_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

-- Create a function to check organization access
CREATE OR REPLACE FUNCTION check_organization_access(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = org_id
    AND om.user_id = auth.uid()
  );
END;
$$ LANGUAGE sql SECURITY DEFINER;

-- Note: RLS policies would be created based on your authentication setup
-- These are placeholder policies that would need to be customized

-- Example policy for organizations (requires proper JWT claims setup)
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Insert default chart of accounts template
-- This would be used when creating a new organization