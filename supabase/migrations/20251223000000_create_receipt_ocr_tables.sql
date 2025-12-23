-- Migration: Create receipt OCR tables
-- Simplified schema for receipt scanning MVP

-- =============================================================================
-- Table: receipt_images
-- Stores receipt image metadata and storage paths
-- =============================================================================
CREATE TABLE IF NOT EXISTS receipt_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expense_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

    -- Storage info
    storage_path TEXT NOT NULL,           -- Path in Supabase storage: receipts/{user_id}/{id}.webp
    thumbnail_path TEXT,                   -- Path to thumbnail: receipts/{user_id}/{id}_thumb.webp
    file_size_bytes INTEGER,
    mime_type TEXT DEFAULT 'image/webp',

    -- Metadata
    original_filename TEXT,

    -- Timestamps
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_receipt_images_user_id ON receipt_images(user_id);
CREATE INDEX idx_receipt_images_expense_id ON receipt_images(expense_id);
CREATE INDEX idx_receipt_images_uploaded_at ON receipt_images(uploaded_at DESC);

-- =============================================================================
-- Table: receipt_ocr_data
-- Stores extracted data from OCR processing
-- =============================================================================
CREATE TABLE IF NOT EXISTS receipt_ocr_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_image_id UUID NOT NULL REFERENCES receipt_images(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Raw response for debugging
    raw_ocr_response JSONB,

    -- Extracted fields
    merchant_name TEXT,
    merchant_address TEXT,
    transaction_date DATE,
    transaction_time TIME,
    currency_code TEXT,                    -- Detected currency (CAD, USD, SGD, etc.)
    subtotal_amount DECIMAL(12, 2),
    tax_amount DECIMAL(12, 2),
    total_amount DECIMAL(12, 2),

    -- Additional extracted data
    receipt_number TEXT,                   -- Receipt/transaction ID on the receipt
    payment_method_hint TEXT,              -- Last 4 digits or card type if visible

    -- OCR metadata
    ocr_provider TEXT NOT NULL,            -- 'mindee' or 'taggun'
    ocr_confidence_score DECIMAL(3, 2),    -- 0.00 to 1.00
    ocr_processed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Processing status
    processing_status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_receipt_ocr_data_receipt_image_id ON receipt_ocr_data(receipt_image_id);
CREATE INDEX idx_receipt_ocr_data_user_id ON receipt_ocr_data(user_id);
CREATE INDEX idx_receipt_ocr_data_transaction_date ON receipt_ocr_data(transaction_date);
CREATE INDEX idx_receipt_ocr_data_processing_status ON receipt_ocr_data(processing_status);

-- =============================================================================
-- Add receipt_image_id to transactions table
-- =============================================================================
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS receipt_image_id UUID REFERENCES receipt_images(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_receipt_image_id ON transactions(receipt_image_id);

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- Enable RLS
ALTER TABLE receipt_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_ocr_data ENABLE ROW LEVEL SECURITY;

-- receipt_images policies
CREATE POLICY "Users can view their own receipt images"
    ON receipt_images FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipt images"
    ON receipt_images FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipt images"
    ON receipt_images FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipt images"
    ON receipt_images FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- receipt_ocr_data policies
CREATE POLICY "Users can view their own OCR data"
    ON receipt_ocr_data FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OCR data"
    ON receipt_ocr_data FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OCR data"
    ON receipt_ocr_data FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OCR data"
    ON receipt_ocr_data FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- =============================================================================
-- Updated_at trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_receipt_images_updated_at
    BEFORE UPDATE ON receipt_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipt_ocr_data_updated_at
    BEFORE UPDATE ON receipt_ocr_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
