-- Rename cap_periodicity to cap_duration
ALTER TABLE reward_rules
RENAME COLUMN cap_periodicity TO cap_duration;
