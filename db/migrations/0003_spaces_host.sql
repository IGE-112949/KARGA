ALTER TYPE "public"."space_status" ADD VALUE 'deleted';--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_space_id_spaces_id_fk";
--> statement-breakpoint
ALTER TABLE "spaces" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "space_availability_one_per_day" ON "space_availability" USING btree ("space_id","weekday");