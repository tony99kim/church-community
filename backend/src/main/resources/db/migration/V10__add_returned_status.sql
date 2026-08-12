-- Drop old status check constraints and re-add with RETURNED value
ALTER TABLE item_rentals DROP CONSTRAINT IF EXISTS item_rentals_status_check;
ALTER TABLE item_rentals ADD CONSTRAINT item_rentals_status_check
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'RETURNED'));

ALTER TABLE space_rentals DROP CONSTRAINT IF EXISTS space_rentals_status_check;
ALTER TABLE space_rentals ADD CONSTRAINT space_rentals_status_check
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'RETURNED'));
