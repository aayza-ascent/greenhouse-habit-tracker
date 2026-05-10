-- Greenhouse · decor placement
-- ----------------------------------------------------------------------------
-- Adds a slot_index column to decor_owned so users can place owned decor
-- onto a horizontal "shelf" strip above the plant grid. NULL means
-- unplaced (sits in the edit-mode tray); 0..7 means it's in that strip slot.
-- A unique partial index keeps two items from claiming the same slot.

alter table public.decor_owned
  add column if not exists slot_index smallint
  check (slot_index is null or slot_index between 0 and 7);

create unique index if not exists decor_owned_one_per_slot
  on public.decor_owned (user_id, slot_index)
  where slot_index is not null;
