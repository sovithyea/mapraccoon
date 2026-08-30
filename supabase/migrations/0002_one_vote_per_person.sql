  -- One vote per person per room (D40).
  --
  -- 0001 appended. Every POST inserted a new row and `resolve()` counted every
  -- row, so a friend who reopened the link and voted again was counted twice —
  -- while the voter count on screen de-duplicated by name, so a single screen
  -- showed two different totals for the same room. Observed against this store:
  -- four distinct names, five rows, and a tally reading `4 · 1 · 0` for a
  -- candidate five people had never marked (C32).
  --
  -- The identity is the typed name, because it is the only identity the product
  -- has and inventing a second one would mean inventing accounts. The cost is
  -- stated rather than discovered: two friends who both type "Sok" overwrite
  -- each other, and there is no way for the app to tell that from one person
  -- changing their mind. At five-friends scale that is the right trade; it is
  -- the wrong one the moment a room is bigger than a table.

  -- Existing duplicates must go before the index can exist. Newest row wins,
  -- which is the same rule the upsert applies from here on.
  delete from public.votes a
  using public.votes b
  where a.room_id = b.room_id
    and a.voter   = b.voter
    and a.id      < b.id;

  -- The constraint the route's upsert infers its ON CONFLICT target from.
  -- It is what makes "one vote per person" a property of the store rather than
  -- a habit of the only current writer.
  create unique index if not exists votes_room_voter_key
    on public.votes (room_id, voter);
