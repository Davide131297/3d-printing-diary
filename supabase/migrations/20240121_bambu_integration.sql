-- Add columns to printers table
ALTER TABLE public.printers 
ADD COLUMN IF NOT EXISTS ip TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS access_code_encrypted TEXT,
ADD COLUMN IF NOT EXISTS serial TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS connected BOOLEAN DEFAULT false;

-- Add columns to prints table
ALTER TABLE public.prints
ADD COLUMN IF NOT EXISTS auto_captured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS printer_id UUID REFERENCES public.printers(id);

-- Ensure RLS is enabled for printers (already done in schema.sql but good to double check safety)
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;

-- Re-apply or ensure policies exist (optional, assuming they might need update if logic changed, but basic ownership stays same)
-- existing policies in schema.sql handle "user_id = auth.uid()" which covers these new columns too.
