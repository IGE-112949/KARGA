-- Regras que o Drizzle não declara.

-- Perfil ligado ao utilizador da Supabase Auth (apagar o utilizador apaga o perfil e, em cascata, os dados).
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_auth_users_fk"
  FOREIGN KEY ("id") REFERENCES auth.users ("id") ON DELETE CASCADE;--> statement-breakpoint

-- O drizzle-kit gera geometry(point) sem SRID; fixa-se WGS84 (4326).
ALTER TABLE "spaces" ALTER COLUMN "location" TYPE geometry(Point, 4326) USING ST_SetSRID("location", 4326);--> statement-breakpoint

-- Não pode haver duas reservas confirmadas sobrepostas no mesmo espaço.
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist ("space_id" WITH =, tstzrange("starts_at", "ends_at") WITH &&)
  WHERE ("status" = 'confirmed');--> statement-breakpoint

-- RLS ativo sem políticas: só a API (ligação de servidor) acede às tabelas.
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "spaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "space_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "space_availability" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "space_blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Taxa de serviço inicial: 10%.
INSERT INTO "platform_settings" ("key", "value") VALUES ('service_fee_percent', 10)
  ON CONFLICT ("key") DO NOTHING;
