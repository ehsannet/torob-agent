import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { WeeklyHours } from "../lib/hours";

export type SellerQuestion = {
  key: "stock" | "price" | "hours" | "warranty";
  label: string;
};

export const priceUnitEnum = pgEnum("price_unit", ["TOMAN", "RIAL"]);
export const stockStatusEnum = pgEnum("stock_status", [
  "in_stock",
  "out_of_stock",
  "unknown",
]);
export const observationSourceEnum = pgEnum("observation_source", [
  "seller_response",
  "simulator",
]);
export const sellerCheckStatusEnum = pgEnum("seller_check_status", [
  "created",
  "sent",
  "answered",
  "expired",
]);

export const shops = pgTable(
  "shops",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    nameNormalized: text("name_normalized").notNull(),
    businessType: text("business_type"),
    activityCategory: text("activity_category"),
    description: text("description"),
    images: text("images")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    torobHistory: text("torob_history"),
    licenses: text("licenses")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    addressText: text("address_text").notNull(),
    addressNormalized: text("address_normalized").notNull(),
    mallName: text("mall_name"),
    floor: text("floor"),
    unit: text("unit"),
    street: text("street"),
    landmark: text("landmark"),
    locationNotes: text("location_notes"),
    addressConfidence: real("address_confidence").notNull().default(0.5),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    weeklyHours: jsonb("weekly_hours").$type<WeeklyHours>(),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    bale: text("bale"),
    instagram: text("instagram"),
    website: text("website"),
    acceptsTorobPay: boolean("accepts_torob_pay").notNull().default(false),
    offersInstallments: boolean("offers_installments").notNull().default(false),
    acceptsKalabarg: boolean("accepts_kalabarg").notNull().default(false),
    hasFastDelivery: boolean("has_fast_delivery").notNull().default(false),
    isSample: boolean("is_sample").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("shops_name_norm_idx").on(table.nameNormalized),
    index("shops_activity_idx").on(table.activityCategory),
    index("shops_coords_idx").on(table.latitude, table.longitude),
  ],
);

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    titleFa: text("title_fa").notNull(),
    titleFaNormalized: text("title_fa_normalized").notNull(),
    titleEn: text("title_en"),
    brand: text("brand"),
    brandNormalized: text("brand_normalized"),
    category: text("category").notNull(),
    specs: jsonb("specs")
      .$type<Record<string, string>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    description: text("description"),
    images: text("images")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    isSample: boolean("is_sample").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("products_title_norm_idx").on(table.titleFaNormalized),
    index("products_brand_norm_idx").on(table.brandNormalized),
    index("products_category_idx").on(table.category),
  ],
);

export const offers = pgTable(
  "offers",
  {
    id: text("id").primaryKey(),
    shopId: text("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sellerTitle: text("seller_title"),
    sellerTitleNormalized: text("seller_title_normalized"),
    sellerDescription: text("seller_description"),
    price: integer("price"),
    priceUnit: priceUnitEnum("price_unit").notNull().default("TOMAN"),
    warrantyProvider: text("warranty_provider"),
    warrantyDurationMonths: integer("warranty_duration_months"),
    lastPriceChangeAt: timestamp("last_price_change_at", {
      withTimezone: true,
    }),
    isSample: boolean("is_sample").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("offers_shop_idx").on(table.shopId),
    index("offers_product_idx").on(table.productId),
    index("offers_price_idx").on(table.price),
    index("offers_last_change_idx").on(table.lastPriceChangeAt),
  ],
);

export const offerObservations = pgTable(
  "offer_observations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offerId: text("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    confirmedPrice: integer("confirmed_price"),
    stockStatus: stockStatusEnum("stock_status").notNull().default("unknown"),
    note: text("note"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    source: observationSourceEnum("source").notNull(),
  },
  (table) => [
    index("offer_obs_offer_idx").on(table.offerId, table.confirmedAt),
  ],
);

export const shopObservations = pgTable(
  "shop_observations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: text("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    confirmedHours: jsonb("confirmed_hours").$type<WeeklyHours>(),
    note: text("note"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    source: observationSourceEnum("source").notNull(),
  },
  (table) => [
    index("shop_obs_shop_idx").on(table.shopId, table.confirmedAt),
  ],
);

export const sellerChecks = pgTable(
  "seller_checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull(),
    shopId: text("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    offerId: text("offer_id").references(() => offers.id, {
      onDelete: "set null",
    }),
    questions: jsonb("questions")
      .$type<SellerQuestion[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    status: sellerCheckStatusEnum("status").notNull().default("created"),
    sessionId: text("session_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("seller_checks_token_idx").on(table.token),
    index("seller_checks_shop_idx").on(table.shopId),
    index("seller_checks_status_idx").on(table.status),
  ],
);

export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;
export type OfferObservation = typeof offerObservations.$inferSelect;
export type ShopObservation = typeof shopObservations.$inferSelect;
export type SellerCheck = typeof sellerChecks.$inferSelect;
