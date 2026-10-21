CREATE TYPE "public"."observation_source" AS ENUM('seller_response', 'simulator');--> statement-breakpoint
CREATE TYPE "public"."price_unit" AS ENUM('TOMAN', 'RIAL');--> statement-breakpoint
CREATE TYPE "public"."seller_check_status" AS ENUM('created', 'sent', 'answered', 'expired');--> statement-breakpoint
CREATE TYPE "public"."stock_status" AS ENUM('in_stock', 'out_of_stock', 'unknown');--> statement-breakpoint
CREATE TABLE "offer_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" text NOT NULL,
	"confirmed_price" integer,
	"stock_status" "stock_status" DEFAULT 'unknown' NOT NULL,
	"note" text,
	"confirmed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" "observation_source" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"product_id" text NOT NULL,
	"seller_title" text,
	"seller_title_normalized" text,
	"seller_description" text,
	"price" integer,
	"price_unit" "price_unit" DEFAULT 'TOMAN' NOT NULL,
	"warranty_provider" text,
	"warranty_duration_months" integer,
	"last_price_change_at" timestamp with time zone,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"title_fa" text NOT NULL,
	"title_fa_normalized" text NOT NULL,
	"title_en" text,
	"brand" text,
	"brand_normalized" text,
	"category" text NOT NULL,
	"specs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" text,
	"images" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"shop_id" text NOT NULL,
	"offer_id" text,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "seller_check_status" DEFAULT 'created' NOT NULL,
	"session_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"answered_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shop_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" text NOT NULL,
	"confirmed_hours" jsonb,
	"note" text,
	"confirmed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" "observation_source" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"business_type" text,
	"activity_category" text,
	"description" text,
	"images" text[] DEFAULT '{}'::text[] NOT NULL,
	"torob_history" text,
	"licenses" text[] DEFAULT '{}'::text[] NOT NULL,
	"address_text" text NOT NULL,
	"address_normalized" text NOT NULL,
	"mall_name" text,
	"floor" text,
	"unit" text,
	"street" text,
	"landmark" text,
	"location_notes" text,
	"address_confidence" real DEFAULT 0.5 NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"weekly_hours" jsonb,
	"phone" text,
	"whatsapp" text,
	"bale" text,
	"instagram" text,
	"website" text,
	"accepts_torob_pay" boolean DEFAULT false NOT NULL,
	"offers_installments" boolean DEFAULT false NOT NULL,
	"accepts_kalabarg" boolean DEFAULT false NOT NULL,
	"has_fast_delivery" boolean DEFAULT false NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offer_observations" ADD CONSTRAINT "offer_observations_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_checks" ADD CONSTRAINT "seller_checks_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_checks" ADD CONSTRAINT "seller_checks_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_observations" ADD CONSTRAINT "shop_observations_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "offer_obs_offer_idx" ON "offer_observations" USING btree ("offer_id","confirmed_at");--> statement-breakpoint
CREATE INDEX "offers_shop_idx" ON "offers" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "offers_product_idx" ON "offers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "offers_price_idx" ON "offers" USING btree ("price");--> statement-breakpoint
CREATE INDEX "offers_last_change_idx" ON "offers" USING btree ("last_price_change_at");--> statement-breakpoint
CREATE INDEX "products_title_norm_idx" ON "products" USING btree ("title_fa_normalized");--> statement-breakpoint
CREATE INDEX "products_brand_norm_idx" ON "products" USING btree ("brand_normalized");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "seller_checks_token_idx" ON "seller_checks" USING btree ("token");--> statement-breakpoint
CREATE INDEX "seller_checks_shop_idx" ON "seller_checks" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "seller_checks_status_idx" ON "seller_checks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shop_obs_shop_idx" ON "shop_observations" USING btree ("shop_id","confirmed_at");--> statement-breakpoint
CREATE INDEX "shops_name_norm_idx" ON "shops" USING btree ("name_normalized");--> statement-breakpoint
CREATE INDEX "shops_activity_idx" ON "shops" USING btree ("activity_category");--> statement-breakpoint
CREATE INDEX "shops_coords_idx" ON "shops" USING btree ("latitude","longitude");