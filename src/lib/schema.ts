import { z } from "zod";

export const CategoryEnum = z.enum([
  "heritage",
  "nature",
  "food",
  "spiritual",
  "adventure",
  "beach",
  "wildlife",
  "coffee",
  "culture",
]);
export type Category = z.infer<typeof CategoryEnum>;

export const RegionEnum = z.enum([
  "Mysuru",
  "Hassan",
  "Hampi-Ballari",
  "Badami-Bagalkot",
  "Coast",
  "Coorg",
  "Chikkamagaluru",
  "Bengaluru",
  "Dharwad-Hubballi",
  "Kalyana-Karnataka",
  "North Kannada",
]);
export type Region = z.infer<typeof RegionEnum>;

export const BudgetFitEnum = z.enum(["budget", "mid", "premium"]);
export type BudgetFit = z.infer<typeof BudgetFitEnum>;

export const MealTypeEnum = z.enum(["breakfast", "lunch", "dinner", "snack"]);
export type MealType = z.infer<typeof MealTypeEnum>;

export const PhraseContextEnum = z.enum([
  "greeting",
  "ticket",
  "food",
  "directions",
  "transport",
  "shopping",
  "temple",
  "thanks",
]);
export type PhraseContext = z.infer<typeof PhraseContextEnum>;

export const PhraseSchema = z.object({
  id: z.string(),
  kn: z.string(),
  translit: z.string(),
  en: z.string(),
  context: PhraseContextEnum,
});
export type Phrase = z.infer<typeof PhraseSchema>;

export const PlaceImageSchema = z.object({
  file: z.string(),
  thumb: z.string().optional(),
  alt_en: z.string(),
  alt_kn: z.string(),
  credit: z.string(),
  license: z.string(),
  source_url: z.string(),
});
export type PlaceImage = z.infer<typeof PlaceImageSchema>;

export const PlaceSchema = z.object({
  id: z.string(),
  name_en: z.string(),
  name_kn: z.string(),
  region: RegionEnum,
  city: z.string(),
  lat: z.number(),
  lng: z.number(),
  categories: z.array(CategoryEnum),
  duration_min: z.number().positive(),
  entry_inr: z.number().nonnegative(),
  best_months: z.array(z.number().min(1).max(12)),
  budget_fit: z.array(BudgetFitEnum),
  is_meal: MealTypeEnum.optional(),
  desc_en: z.string(),
  desc_kn: z.string(),
  tip_en: z.string(),
  tip_kn: z.string().optional(),
  phrase_ids: z.array(z.string()),
  verified: z.boolean(),
  source_url: z.string().optional(),
  best_time_en: z.string().optional(),
  crowd: z.enum(["low", "medium", "high"]).optional(),
  opening_hours: z.string().optional(),
  image: PlaceImageSchema.optional(),
});
export type Place = z.infer<typeof PlaceSchema>;

export const StartCitySchema = z
  .string()
  .trim()
  .min(1, "Please provide a starting city or town")
  .max(40, "Starting city name cannot exceed 40 characters");
export const StartCityEnum = StartCitySchema;
export type StartCity = string;

export const PaceEnum = z.enum(["relaxed", "balanced", "packed"]);
export type Pace = z.infer<typeof PaceEnum>;

export const TravellersEnum = z.enum(["solo", "couple", "family", "friends"]);
export type Travellers = z.infer<typeof TravellersEnum>;

export const FoodPreferenceEnum = z.enum(["any", "veg", "nonveg"]);
export type FoodPreference = z.infer<typeof FoodPreferenceEnum>;

export const TransportPreferenceEnum = z.enum(["cab", "own_car", "bus_train"]);
export type TransportPreference = z.infer<typeof TransportPreferenceEnum>;

export const PlanRequestSchema = z.object({
  interests: z.array(CategoryEnum).min(1, "Pick at least one interest").max(4, "Pick at most 4 interests"),
  days: z.number().int("Days must be an integer").min(1).max(7),
  start_city: StartCityEnum,
  budget: BudgetFitEnum,
  pace: PaceEnum,
  travellers: TravellersEnum,
  month: z.number().int("Month must be an integer").min(1).max(12),
  lang: z.enum(["en", "kn"]),
  people_count: z.number().int("Group size must be an integer").min(1).max(10).optional(),
  food_preference: FoodPreferenceEnum.optional(),
  transport_mode: TransportPreferenceEnum.optional(),
  low_walking: z.boolean().optional(),
});
export type PlanRequest = z.infer<typeof PlanRequestSchema>;

export const AIModelOutputStopSchema = z.object({
  place_id: z.string(),
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start must be HH:MM format"),
  note_en: z.string().max(200),
});

export const AIModelOutputDaySchema = z.object({
  day: z.number().min(1),
  theme: z.string().max(60),
  stops: z.array(AIModelOutputStopSchema),
});

export const AIModelOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  days: z.array(AIModelOutputDaySchema),
  tips: z.array(z.string()),
});
export type AIModelOutput = z.infer<typeof AIModelOutputSchema>;

export const TravelModeEnum = z.enum(["auto", "cab", "bus", "walk"]);
export type TravelMode = z.infer<typeof TravelModeEnum>;

export const TravelFromPrevSchema = z.object({
  km: z.number().nonnegative(),
  min: z.number().nonnegative(),
  mode: TravelModeEnum,
});
export type TravelFromPrev = z.infer<typeof TravelFromPrevSchema>;

export const StopSchema = z.object({
  place_id: z.string(),
  start: z.string(),
  duration_min: z.number(),
  note_en: z.string(),
  travel_from_prev: TravelFromPrevSchema.nullish(),
  place: PlaceSchema,
  phrases: z.array(PhraseSchema),
});
export type Stop = z.infer<typeof StopSchema>;

export const DayPlanSchema = z.object({
  day: z.number(),
  theme: z.string(),
  stops: z.array(StopSchema),
  travel_total_min: z.number(),
});
export type DayPlan = z.infer<typeof DayPlanSchema>;

export const CostSummarySchema = z.object({
  stay: z.number(),
  food: z.number(),
  transport: z.number(),
  entry: z.number(),
  total: z.number(),
  people: z.number(),
});
export type CostSummary = z.infer<typeof CostSummarySchema>;

// The request a plan was built from, kept with the plan so edits made after
// opening a shared link recompute costs and legs for the right trip.
export const PlanTripSchema = z.object({
  start_city: StartCitySchema,
  budget: BudgetFitEnum,
  travellers: TravellersEnum,
  month: z.number().int().min(1).max(12),
  transport_mode: TransportPreferenceEnum.optional(),
});
export type PlanTrip = z.infer<typeof PlanTripSchema>;

export const PlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  days: z.array(DayPlanSchema),
  cost: CostSummarySchema,
  tips: z.array(z.string()),
  source: z.enum(["ai-groq", "ai-gemini", "planner", "sample"]),
  trip: PlanTripSchema.optional(),
});
export type Plan = z.infer<typeof PlanSchema>;
