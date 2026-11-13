-- Lista de espera do site (aplicada no Supabase pelo conector; o site insere com a chave pública).
-- Qualquer visitante pode inserir; ninguém lê pela chave pública (RLS sem política de select).
create table if not exists public.lista_espera (
  id uuid primary key default gen_random_uuid(),
  perfil text not null check (perfil in ('condutor', 'proprietario', 'ambos')),
  nome text not null check (char_length(btrim(nome)) between 1 and 60),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  codigo_postal text not null check (codigo_postal ~ '^\d{4}-\d{3}$'),
  ve_situacao text check (ve_situacao in ('tem', 'vai_comprar')),
  carrega_onde text check (carrega_onde in ('rede_publica', 'trabalho', 'familiares', 'outro')),
  tipo_lugar text check (tipo_lugar in ('box', 'garagem_coletiva', 'exterior')),
  tomada text check (tomada in ('tomada', 'wallbox', 'nao_tem')),
  kit text check (kit in ('sem', 'basico', 'pro', 'nao_sei')),
  consentimento boolean not null check (consentimento),
  utm_source text check (char_length(utm_source) <= 100),
  utm_medium text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  criado_em timestamptz not null default now()
);

alter table public.lista_espera enable row level security;

revoke all on public.lista_espera from anon, authenticated;
grant insert on public.lista_espera to anon, authenticated;

drop policy if exists lista_espera_inserir on public.lista_espera;
create policy lista_espera_inserir on public.lista_espera
  for insert to anon, authenticated
  with check (consentimento and criado_em >= now() - interval '1 minute');
