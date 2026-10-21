-- DataBov v2 — leads + config (rode no SQL Editor)
create table if not exists leads (
  id bigint generated always as identity primary key,
  nome text not null check (char_length(nome) between 2 and 80),
  email text not null check (char_length(email) between 5 and 120),
  whatsapp text not null default '' check (char_length(whatsapp) <= 20),
  perfil text not null default 'produtor',
  rebanho int not null default 0 check (rebanho >= 0),
  criado_em timestamptz not null default now()
);
alter table leads enable row level security;
drop policy if exists "leads insercao" on leads;
create policy "leads insercao" on leads for insert with check (true);

create table if not exists app_config (chave text primary key, valor text not null);
alter table app_config enable row level security;
drop policy if exists "config publica" on app_config;
create policy "config publica" on app_config for select using (true);
insert into app_config (chave, valor) values
  ('whatsapp_comercial', '5555997302586'),
  ('email_comercial', 'wagner.schemmer.martins1@gmail.com')
on conflict (chave) do nothing;

-- O site (app.js) lê a tabela `site_config` (chave/valor), compartilhada com o
-- projeto da Bárbara. A chave do DataBov é `whatsapp_databov`.
-- Sem essa chave, o site usa o número padrão 5555997302586 definido no app.js.
-- Para configurar pelo SQL Editor:
--   insert into site_config (chave, valor)
--   values ('whatsapp_databov', '5555997302586')
--   on conflict (chave) do update set valor = excluded.valor;
