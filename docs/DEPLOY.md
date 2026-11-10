# Deploy para testes do grupo

- **API** → Render (plano grátis), ligado à `main`: cada push que mexa em `apps/api` volta a publicar sozinho.
- **App** → Expo Go + `eas update` (canal `preview`): cada um abre a app pelo link/QR; as novas versões chegam ao reabrir.
- **Site** → Vercel (já está).

## 1. API no Render (uma vez)
1. Entrar em render.com com o GitHub → **New → Blueprint** → escolher o repositório `IGE-112949/KARGA`. O Render lê o `render.yaml`.
2. Preencher os dois segredos que ele pede:
   - `DATABASE_URL`: no Supabase, botão **Connect** → **Session pooler** (o "Direct connection" não funciona no Render: é só IPv6). Copiar e pôr a password da base de dados.
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase → Project Settings → API Keys → `service_role` / secret.
3. **Apply**. Quando acabar, abrir `https://<nome>.onrender.com/health` → `{"status":"ok"}`.

No plano grátis a API adormece ao fim de ~15 min sem uso; o primeiro pedido demora ~30–60 s.

## 2. Expo (uma vez, no PC)
Em `apps/mobile`:
```
npx eas-cli@latest login
npx eas-cli@latest init
```
(o `init` cria o projeto no expo.dev — escolher a organização do grupo — e escreve o `projectId` no `app.json`; fazer commit desse `app.json`.)

Copiar `.env.production.example` para `.env.production` e pôr o endereço do Render em `EXPO_PUBLIC_API_URL`.

## 3. Publicar uma versão (sempre que quiseres)
Em `apps/mobile`:
```
npm run publish:preview -- "o que mudou"
```
No fim aparece um link para o expo.dev; lá, em **Preview**, há o QR code para partilhar.

## 4. O grupo
1. Instalar o **Expo Go** (Play Store / App Store).
2. Ler o QR code (Android: dentro do Expo Go; iPhone: com a câmara) ou abrir o link.
3. Para receber uma versão nova: fechar e voltar a abrir a app.
