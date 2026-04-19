ALTER TABLE wines
  ADD COLUMN IF NOT EXISTS image_source TEXT
  CHECK (image_source IN ('scan', 'upload', 'auto'));
