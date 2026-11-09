CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'cancelled_by_driver', 'cancelled_by_host', 'completed');--> statement-breakpoint
CREATE TYPE "public"."plug_type" AS ENUM('type2', 'schuko', 'ccs');--> statement-breakpoint
CREATE TYPE "public"."space_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."space_type" AS ENUM('closed_garage', 'covered', 'outdoor');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"price_per_hour" numeric(6, 2) NOT NULL,
	"energy_price_kwh" numeric(5, 3),
	"service_fee_percent" numeric(5, 2) NOT NULL,
	"service_fee" numeric(6, 2) NOT NULL,
	"estimated_total" numeric(8, 2) NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_range" CHECK ("bookings"."ends_at" > "bookings"."starts_at"),
	CONSTRAINT "bookings_price_positive" CHECK ("bookings"."price_per_hour" > 0)
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" numeric NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"avatar_url" text,
	"is_driver" boolean DEFAULT false NOT NULL,
	"is_host" boolean DEFAULT false NOT NULL,
	"terms_accepted_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_has_role" CHECK ("profiles"."is_driver" or "profiles"."is_host")
);
--> statement-breakpoint
CREATE TABLE "space_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "space_availability_weekday" CHECK ("space_availability"."weekday" between 0 and 6)
);
--> statement-breakpoint
CREATE TABLE "space_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "space_blocks_range" CHECK ("space_blocks"."ends_at" > "space_blocks"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "space_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"address" text NOT NULL,
	"spot_details" text,
	"location" geometry(point) NOT NULL,
	"space_type" "space_type" NOT NULL,
	"power_kw" numeric(4, 1) NOT NULL,
	"plug_type" "plug_type" NOT NULL,
	"access_instructions" text,
	"access_code" text,
	"price_per_hour" numeric(6, 2) NOT NULL,
	"energy_price_kwh" numeric(5, 3),
	"status" "space_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "spaces_power_positive" CHECK ("spaces"."power_kw" > 0),
	CONSTRAINT "spaces_price_positive" CHECK ("spaces"."price_per_hour" > 0),
	CONSTRAINT "spaces_energy_price_positive" CHECK ("spaces"."energy_price_kwh" is null or "spaces"."energy_price_kwh" > 0),
	CONSTRAINT "spaces_access_code_length" CHECK ("spaces"."access_code" is null or char_length("spaces"."access_code") <= 20)
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"make_model" text NOT NULL,
	"plate" text NOT NULL,
	"plug_type" "plug_type" NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_plate_unique" UNIQUE("plate")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_driver_id_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_availability" ADD CONSTRAINT "space_availability_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_blocks" ADD CONSTRAINT "space_blocks_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_photos" ADD CONSTRAINT "space_photos_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_space_idx" ON "bookings" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "bookings_driver_idx" ON "bookings" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "spaces_location_gist" ON "spaces" USING gist ("location");--> statement-breakpoint
CREATE INDEX "spaces_owner_idx" ON "spaces" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_one_default_per_user" ON "vehicles" USING btree ("user_id") WHERE "vehicles"."is_default";