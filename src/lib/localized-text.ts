import { z } from "zod";

/**
 * English required, Khmer optional — the same shape as the UI dictionaries, so
 * seed data and interface copy sit on one translation path rather than two.
 *
 * Lives in its own module because both `spots/schema.ts` and `hours/schema.ts`
 * need it, and having hours import it from spots made a cycle: spots imports
 * hours for the `hours` field, hours imported spots for this. The cycle only
 * surfaced at runtime, as `Cannot access 'localizedTextSchema' before
 * initialization` — typecheck was perfectly happy with it.
 */
export const localizedTextSchema = z.object({
  en: z.string().min(1),
  km: z.string().min(1).optional(),
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;
