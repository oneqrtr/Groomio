# Supabase Realtime for New Appointment Sound

The new-appointment notifier uses **Supabase Realtime** first and falls back to **polling every 25s** if Realtime is not available.

## Enable Realtime for `appointments` (optional)

1. In Supabase Dashboard: **Database → Replication** (or **Replication** under Database).
2. Find the **public** publication (or create one).
3. Add the **appointments** table to the publication so that `INSERT` events are broadcast.

Alternatively via SQL:

```sql
-- Add appointments table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
```

If Realtime is not enabled for `appointments`, the app automatically uses **polling** (every 25 seconds) with no code changes.

## Row Level Security (RLS)

Ensure your anon key can:

- **Select** appointments for the barber: `barber_id = ...` (and optionally `status = 'booked'`).
- **Realtime**: If using Realtime, the same RLS policies apply to postgres_changes; allow read for the barber’s rows if needed.

No other Realtime setup is required; the hook subscribes to `postgres_changes` with `event: 'INSERT'` and `filter: barber_id=eq.<id>`.
