-- Add columns if missing (idempotent)
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS open_time TIME;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS close_time TIME;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS slot_minutes INT;

-- Fill NULL values
UPDATE spaces SET open_time = '09:00' WHERE open_time IS NULL;
UPDATE spaces SET close_time = '21:00' WHERE close_time IS NULL;
UPDATE spaces SET slot_minutes = 60 WHERE slot_minutes IS NULL;

-- Now enforce NOT NULL
ALTER TABLE spaces ALTER COLUMN open_time SET NOT NULL;
ALTER TABLE spaces ALTER COLUMN close_time SET NOT NULL;
ALTER TABLE spaces ALTER COLUMN slot_minutes SET NOT NULL;
