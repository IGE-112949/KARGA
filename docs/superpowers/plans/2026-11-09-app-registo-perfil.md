# App: registo, login e perfil — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App Expo (React Native) com boas-vindas, login, registo em 3 passos e ecrã de Perfil (dados, modo, veículos, terminar sessão, apagar conta), ligada à Supabase Auth e à API `/me`.

**Architecture:** `apps/mobile` com expo-router. A sessão vem do `supabase-js` (só autenticação); os dados vêm da API via um cliente HTTP que junta o JWT e converte o formato de erro. Um `AuthProvider` decide o destino (boas-vindas / onboarding / app) a partir da sessão e de `GET /me`. UI com um pequeno kit de componentes que reproduz o design base do mockup.

**Tech Stack:** Expo (SDK atual, `npx create-expo-app`), expo-router, TypeScript, @supabase/supabase-js, expo-secure-store + @react-native-async-storage/async-storage + aes-js (sessão), react-native-svg, @expo-google-fonts/outfit, Zod, jest-expo + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-11-09-base-dados-registo-perfil-design.md` (secção 4, "Ecrãs da app")

## Global Constraints

- Dependências Expo instaladas com `npx expo install` (versões compatíveis com o SDK).
- Textos da app em português de Portugal (tratamento por "tu", como no mockup).
- Design base do mockup (`docs/design/mockup/Main.dc.html`): os campos podem mudar, o aspeto não.
- Tokens (valores exatos do mockup): accent `#10B981`; navy/texto `#13263A`; texto secundário `#5B6670`; texto de label `#3E4B57`; verde escuro (links) `#047857`; verde texto em fundo claro `#065F46`; fundo claro verde `#ECF8F2`; bordas de campo `#D5DCD9` (1.5px); divisores `#E3E9E6`/`#E8EDEB`; fundo de ecrã `#F6F8F7`; superfície cinza `#F4F7F6`; branco `#FFFFFF`. Fonte Outfit 400/500/600/700. Raios: campo 14, botão 16, cartão 20–22, chip 20. Botão primário: altura 56, texto 17/600 branco, sombra `0 6 16 rgba(16,185,129,0.3)`. Campo: altura 50–52, texto 16, label 14/500 `#3E4B57`. Título de ecrã 28/700.
- Só login social **Google**, mostrado desativado com "Em breve". Nunca Apple.
- Variáveis: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL`.
- A app nunca usa a service_role key nem acede às tabelas diretamente.
- Testes em `apps/mobile/test/` (excluídos da entrega final, como na API).

## Review Focus

1. Sem rede / API desligada ao arrancar com sessão guardada → ecrã de erro com "Tentar novamente", não ecrã em branco nem volta ao login (Task 4).
2. Registo interrompido depois do passo 1 (app fechada) → ao reabrir, retoma no passo 2 com o nome guardado (Task 4/5).
3. Erros da Supabase em inglês ("Invalid login credentials", "User already registered") → mensagem em português (Task 3).
4. Duplo toque em botões que fazem pedidos (Entrar, Continuar, Guardar veículo) → um só pedido; botão mostra estado a carregar (Task 2).
5. Sessão expirada (API devolve 401) durante o uso → termina a sessão e volta às boas-vindas (Task 3/4).

---

## File Structure

```
apps/api/src/app.ts                     → + CORS (Task 1)
docs/design/mockup/Main.dc.html         → cópia do mockup (referência de design)
apps/mobile/
  app.json, package.json, tsconfig.json, jest.config.js, babel.config.js, .env.example
  assets/logo.png
  app/_layout.tsx                       → fontes, AuthProvider, Stack
  app/index.tsx                         → redireciona conforme o estado
  app/(auth)/welcome.tsx, login.tsx
  app/(auth)/register/index.tsx, role.tsx, vehicle.tsx
  app/(app)/_layout.tsx                 → tabs
  app/(app)/home.tsx, bookings.tsx, wallet.tsx   → "Em breve"
  app/(app)/profile/index.tsx, vehicle-form.tsx
  src/theme.ts
  src/ui/{Button,TextField,Checkbox,RoleCard,StepDots,BackButton,Screen,Chip,Icon}.tsx
  src/lib/supabase.ts, sessionStorage.ts, api.ts, authErrors.ts, validation.ts, plate.ts
  src/auth/AuthProvider.tsx, resolveStatus.ts
  src/onboarding/draft.ts               → estado do registo (passo 1 → 2)
  test/...
scripts/visual-check.mjs                → capturas app vs mockup (dev)
```

---

### Task 1: CORS na API e cópia do mockup

**Files:**
- Modify: `apps/api/src/app.ts`, `apps/api/package.json`
- Create: `docs/design/mockup/Main.dc.html` (copiar de `/tmp/claude-0/-home-claude/6613dafd-def3-5dd7-8afe-52424b28d5b2/scratchpad/artifact-files/6f72611a-1333-4ed9-b32a-ad77bba75832/project/Main.dc.html`), `docs/design/mockup/logo.png`
- Test: `apps/api/test/cors.test.ts`

- [ ] **Step 1:** Teste: `OPTIONS /me` com `Origin: http://localhost:8081` → 204 e `access-control-allow-origin` presente com `Authorization` em `access-control-allow-headers`.
- [ ] **Step 2:** `npm test -w apps/api -- cors` → FAIL.
- [ ] **Step 3:** `cors` (npm) montado antes de tudo em `createApp`, com `origin: true` (só a API móvel/web de desenvolvimento a consome; sem cookies).
- [ ] **Step 4:** Suite da API → PASS.
- [ ] **Step 5:** Commit `feat(api): CORS para a app web` + `docs: mockup de referência`.

### Task 2: Projeto Expo, tema e kit de UI

**Files:**
- Create: `apps/mobile/*` (via `npx create-expo-app@latest apps/mobile --template blank-typescript`, depois expo-router segundo a documentação oficial), `src/theme.ts`, `src/ui/*.tsx`, `assets/logo.png` (de `docs/design/mockup/logo.png`)
- Test: `test/ui.test.tsx`

**Interfaces:**
- Produces:
  - `theme = { colors: {...}, radius: { field: 14, button: 16, card: 20, chip: 20 }, font: { regular: 'Outfit_400Regular', medium: 'Outfit_500Medium', semibold: 'Outfit_600SemiBold', bold: 'Outfit_700Bold' }, shadow: { primary } }` com os valores das Global Constraints.
  - `<Button title variant="primary"|"secondary"|"text" onPress loading? disabled? />` — enquanto `loading` ou `disabled`, não chama `onPress`; `loading` mostra `ActivityIndicator`; `accessibilityRole="button"`.
  - `<TextField label value onChangeText error? secureTextEntry? keyboardType? autoComplete? hint? />` — mostra `error` (vermelho `#B91C1C`) ou `hint`; o olho de mostrar/esconder em campos `secureTextEntry`.
  - `<Checkbox checked onToggle>{children}</Checkbox>`, `<RoleCard title description icon selected onPress />`, `<StepDots total current />`, `<BackButton onPress />`, `<Screen scroll? background?>`, `<Chip label selected onPress />`, `<Icon name size color />` (SVG dos ícones do mockup usados nestes ecrãs: back, eye, car, home, swap, check, bolt, user, map, calendar, wallet, logout, trash, plus).

- [ ] **Step 1:** Criar o projeto, instalar dependências (`npx expo install expo-router react-native-svg @expo-google-fonts/outfit expo-font expo-secure-store @react-native-async-storage/async-storage`, `npm i @supabase/supabase-js aes-js zod react-native-url-polyfill`, dev: `jest-expo jest @testing-library/react-native @types/jest`). `npm test` configurado com preset `jest-expo`.
- [ ] **Step 2:** Escrever `test/ui.test.tsx`: Button com `loading` não chama `onPress` ao ser pressionado e mostra indicador; Button `disabled` não chama `onPress`; dois toques seguidos num Button cujo `onPress` é uma promise pendente chamam `onPress` só uma vez (o Button fica `loading` enquanto a promise corre); TextField mostra o `error`; Checkbox chama `onToggle`.
- [ ] **Step 3:** `npm test -w apps/mobile -- ui` → FAIL.
- [ ] **Step 4:** Implementar tema e componentes (estilos com os tokens; o Button gere internamente o estado a carregar quando `onPress` devolve uma promise).
- [ ] **Step 5:** `npm test -w apps/mobile -- ui` → PASS; `npx tsc --noEmit -p apps/mobile` sem erros.
- [ ] **Step 6:** Commit `feat(mobile): projeto Expo, tema e componentes base`.

### Task 3: Supabase, sessão, cliente da API e mensagens de erro

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/sessionStorage.ts`, `src/lib/api.ts`, `src/lib/authErrors.ts`, `apps/mobile/.env.example`
- Test: `test/api.test.ts`, `test/authErrors.test.ts`

**Interfaces:**
- Produces:
  - `supabase` (cliente com `auth: { storage: sessionStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }`). `sessionStorage`: no web `undefined` (usa o default do supabase-js); em iOS/Android o padrão *LargeSecureStore* da documentação Supabase (chave AES em `expo-secure-store`, dados cifrados em AsyncStorage).
  - `class ApiError extends Error { status: number; code: string; details?: { field: string; message: string }[] }`
  - `createApi(getToken: () => Promise<string | null>, baseUrl: string, onUnauthorized: () => void)` → `{ get<T>(path), post<T>(path, body), patch<T>(path, body), del(path) }`. Junta `Authorization: Bearer`; resposta não-2xx com corpo `{error}` → lança `ApiError` com esses campos; sem corpo → `ApiError(status, 'HTTP_ERROR', 'Ocorreu um erro. Tenta novamente.')`; falha de rede → `ApiError(0, 'NETWORK_ERROR', 'Sem ligação à internet ou servidor indisponível.')`; 401 → chama `onUnauthorized()` e lança. 204 → `undefined`.
  - `authErrorMessage(err: { message?: string; code?: string } | null): string`.

- [ ] **Step 1:** `test/api.test.ts` (com `fetch` substituído por um stub): envia o header com o token; 404 com `{error:{code:'PROFILE_NOT_FOUND',message:'x'}}` → `ApiError` com `status 404`, `code 'PROFILE_NOT_FOUND'`; 400 com `details` mantém os detalhes; `fetch` a rejeitar → `code 'NETWORK_ERROR'`; 401 chama `onUnauthorized` uma vez; 204 devolve `undefined`.
- [ ] **Step 2:** `test/authErrors.test.ts`: `"Invalid login credentials"` → "Email ou password incorretos."; `code 'user_already_exists'` ou mensagem "User already registered" → "Já existe uma conta com este email."; `code 'weak_password'` → "A password é demasiado fraca (mínimo 8 caracteres, com letras e números)."; `code 'email_address_invalid'` → "Email inválido."; `code 'over_request_rate_limit'` → "Demasiadas tentativas. Espera um pouco e tenta novamente."; outro qualquer → "Não foi possível concluir. Tenta novamente.".
- [ ] **Step 3:** Correr → FAIL.
- [ ] **Step 4:** Implementar.
- [ ] **Step 5:** Correr → PASS.
- [ ] **Step 6:** Commit `feat(mobile): sessão Supabase e cliente da API`.

### Task 4: Estado de autenticação, navegação, boas-vindas e login

**Files:**
- Create: `src/auth/resolveStatus.ts`, `src/auth/AuthProvider.tsx`, `app/_layout.tsx`, `app/index.tsx`, `app/(auth)/welcome.tsx`, `app/(auth)/login.tsx`
- Test: `test/resolveStatus.test.ts`, `test/login.test.tsx`

**Interfaces:**
- Consumes: `supabase`, `createApi`, `ApiError`, `authErrorMessage`, UI kit.
- Produces:
  - `type Profile` = `ProfileDto` da API (`id, fullName, phone, isDriver, isHost, termsAcceptedAt, vehicles[]`), em `src/lib/types.ts`.
  - `type AuthStatus = 'loading' | 'signedOut' | 'onboarding' | 'ready' | 'error'`.
  - `resolveStatus(input: { sessionLoaded: boolean; hasSession: boolean; me: { ok: true; profile: Profile } | { ok: false; error: ApiError } | null }): AuthStatus` — sessão por carregar → `loading`; sem sessão → `signedOut`; sessão e `me` ainda `null` → `loading`; 404 `PROFILE_NOT_FOUND` → `onboarding`; perfil → `ready`; outro erro → `error`.
  - `useAuth()` → `{ status, session, profile, api, refreshProfile(), signOut(), retry() }`. Em 401 da API: `signOut()`.
  - `app/index.tsx` redireciona: `signedOut` → `/welcome`; `onboarding` → `/register/role`; `ready` → `/(app)/profile`; `error` → ecrã com mensagem do erro e botão "Tentar novamente" (`retry`); `loading` → logótipo + indicador.
- Ecrã **Boas-vindas** (mockup "AUTENTICAÇÃO · 1"): mapa decorativo com pins (pode ser simplificado com Views), logótipo, "A tua rede comunitária de carregamento.", botões "Entrar" (primário) e "Criar conta" (secundário).
- Ecrã **Login** (mockup "AUTENTICAÇÃO · 2"): "Bem-vindo de volta", "Entra para encontrar lugares com carregamento perto de ti.", Email, Password, botão "Entrar", separador "ou", "Continuar com Google" desativado com "Em breve", "Ainda não tens conta? Criar conta". `signInWithPassword` com o email `trim().toLowerCase()`; erro → `authErrorMessage` por baixo do formulário.

- [ ] **Step 1:** `test/resolveStatus.test.ts` com os 6 casos acima (incluindo `NETWORK_ERROR` → `error`).
- [ ] **Step 2:** `test/login.test.tsx` (supabase mockado): escrever email com espaços/maiúsculas e password, carregar "Entrar" → `signInWithPassword` chamado com email normalizado; erro `Invalid login credentials` → aparece "Email ou password incorretos."; botão Google está desativado e mostra "Em breve".
- [ ] **Step 3:** Correr → FAIL.
- [ ] **Step 4:** Implementar `resolveStatus`, `AuthProvider` (ouve `onAuthStateChange`; com sessão chama `GET /me`), layouts e os dois ecrãs; carregar as fontes Outfit no `_layout`.
- [ ] **Step 5:** Correr → PASS; `tsc` sem erros.
- [ ] **Step 6:** Commit `feat(mobile): navegação por estado de sessão, boas-vindas e login`.

### Task 5: Registo em 3 passos

**Files:**
- Create: `src/lib/validation.ts`, `src/lib/plate.ts`, `src/onboarding/draft.ts`, `app/(auth)/register/index.tsx`, `role.tsx`, `vehicle.tsx`
- Test: `test/validation.test.ts`, `test/register.test.tsx`

**Interfaces:**
- Produces:
  - `validateRegister({ fullName, email, phone, password, acceptTerms })` → `Record<field, string>` de erros (vazio se válido): nome 2–100 após trim; email com `@` e domínio; telemóvel opcional, sem espaços `^\+[1-9]\d{7,14}$`; password ≥ 8 com pelo menos uma letra e um número; termos obrigatórios. Mensagens iguais às da API.
  - `normalizePlate(input): string | null` — cópia exata da regra da API (`apps/api/src/modules/vehicles/plate.ts`), com os mesmos casos de teste.
  - Passo 1: `supabase.auth.signUp({ email, password, options: { data: { full_name, phone } } })`. Nome e telemóvel ficam no `user_metadata`, para o passo 2 os ler mesmo que a app tenha sido fechada.
  - Passo 2: lê `full_name`/`phone` de `session.user.user_metadata`; `RoleCard` Condutor / Proprietário / Ambos; "Continuar" → `POST /me { fullName, phone, isDriver, isHost, acceptTerms: true }` → `refreshProfile()`; se Proprietário → `/(app)/profile`, senão → `/register/vehicle`.
  - Passo 3: Marca/Modelo, Matrícula, Ficha (chips Tipo 2 / Schuko / CCS) → `POST /me/vehicles` → `/(app)/profile`; "Saltar por agora" → `/(app)/profile`. Erros da API por campo (`details`) mostrados no campo respetivo; `PLATE_TAKEN` na matrícula.
  - Textos: passo 1 "Criar conta" / "Junta-te à rede comunitária de carregamento." / "Li e aceito os Termos de Utilização e a Política de Privacidade, incluindo o tratamento dos meus dados segundo o RGPD."; passo 2 "Como vais usar a Karga?" / "Podes mudar de modo a qualquer momento no Perfil."; passo 3 "Qual é o teu veículo?" / "Usamos estes dados para mostrar só os lugares compatíveis com o teu carro." / "Começar a usar a Karga" / "Saltar por agora". `StepDots` 1/2/3 de 3.

- [ ] **Step 1:** `test/validation.test.ts`: os casos de `normalizePlate` da API; `validateRegister` com termos por aceitar → erro em `acceptTerms`; password `abcdefgh` → erro; telemóvel `"+351 912 345 678"` válido; `"912"` inválido; nome `" A "` inválido.
- [ ] **Step 2:** `test/register.test.tsx`: passo 1 com termos por aceitar não chama `signUp`; preenchido e aceite → `signUp` com `options.data.full_name` (trim) e telemóvel sem espaços; passo 2 com "Ambos" envia `isDriver:true,isHost:true` e o nome do metadata; passo 2 com "Proprietário" navega para o perfil (sem passo 3); passo 3 com resposta `409 PLATE_TAKEN` mostra "Esta matrícula já está registada" no campo da matrícula; "Saltar por agora" não chama a API.
- [ ] **Step 3:** Correr → FAIL.
- [ ] **Step 4:** Implementar.
- [ ] **Step 5:** Correr → PASS; `tsc` sem erros.
- [ ] **Step 6:** Commit `feat(mobile): registo em 3 passos`.

### Task 6: Separadores e Perfil

**Files:**
- Create: `app/(app)/_layout.tsx`, `home.tsx`, `bookings.tsx`, `wallet.tsx`, `app/(app)/profile/index.tsx`, `app/(app)/profile/vehicle-form.tsx`, `src/profile/mode.ts`
- Test: `test/profile.test.tsx`, `test/mode.test.ts`

**Interfaces:**
- Consumes: `useAuth()` (`profile`, `api`, `refreshProfile`, `signOut`).
- Produces:
  - `type AppMode = 'driver' | 'host'`; `initialMode(profile): AppMode` (condutor se `isDriver`, senão proprietário); modo atual guardado em AsyncStorage (`karga.mode`), ignorado se o perfil já não tiver esse papel.
  - Separadores como no mockup: modo condutor "Mapa / Reservas / Carteira / Perfil"; modo proprietário "Início / Espaços / Reservas / Perfil". Os que não são Perfil mostram um ecrã "Em breve" com o ícone respetivo.
  - **Perfil** (mockup "PERFIL"): cabeçalho "Perfil" com o selo do modo ("Modo Condutor" fundo `#ECF8F2` texto `#065F46` / "Modo Proprietário" fundo `#13263A` texto branco), avatar com iniciais, nome, email (da sessão), telemóvel; cartão de troca de modo:
    - com os dois papéis: "Mudar para Modo Proprietário/Condutor" (só muda o modo local);
    - com um só papel: "Ativar Modo Proprietário/Condutor" → `PATCH /me { isHost|isDriver: true }` → `refreshProfile()` → muda o modo.
  - Secção "Os meus veículos": lista (matrícula, marca/modelo, ficha, selo "Predefinido"); tocar abre `vehicle-form` (editar, "Definir como predefinido", "Remover"); botão "Adicionar veículo". Formulário reutiliza os campos do passo 3.
  - Secção "Dados pessoais": editar nome e telemóvel → `PATCH /me`.
  - "Terminar sessão" → `signOut()`.
  - "Apagar conta" (texto vermelho) → confirmação ("Esta ação apaga a tua conta e todos os teus dados. Não pode ser desfeita.") → `DELETE /me` → `signOut()`.

- [ ] **Step 1:** `test/mode.test.ts`: `initialMode` para só condutor, só proprietário e ambos; modo guardado `host` com perfil só condutor → `driver`.
- [ ] **Step 2:** `test/profile.test.tsx` (com `useAuth` mockado): mostra nome, email e "Modo Condutor"; perfil só condutor mostra "Ativar Modo Proprietário" e ao tocar envia `PATCH /me {isHost:true}`; lista os veículos com "Predefinido" no certo; "Apagar conta" só chama `DELETE /me` depois de confirmar; "Terminar sessão" chama `signOut`.
- [ ] **Step 3:** Correr → FAIL.
- [ ] **Step 4:** Implementar.
- [ ] **Step 5:** Correr → PASS; `tsc` sem erros.
- [ ] **Step 6:** Commit `feat(mobile): separadores e ecrã de perfil`.

### Task 7: Verificação visual, README e teste no telemóvel

**Files:**
- Create: `scripts/visual-check.mjs`
- Modify: `README.md`

- [ ] **Step 1:** `scripts/visual-check.mjs`: faz `npx expo export -p web` em `apps/mobile`, serve `dist/` e, com Playwright a 390×844, captura Boas-vindas, Login, Registo 1/2/3 e Perfil. O Perfil usa `page.route` para simular `GET /me` e uma sessão injetada no `localStorage` (nada de código de teste na app). Renderiza os ecrãs equivalentes do mockup e gera `visual-check/<ecrã>.png` com app e mockup lado a lado.
- [ ] **Step 2:** Correr o script e rever cada par. Diferenças no aspeto base (cores, fonte, raios, alturas, espaçamentos, ícones) são corrigidas. Diferenças só de conteúdo/campos são aceites. Registar no ledger o que foi corrigido.
- [ ] **Step 3:** README: secção "App móvel" (`.env` com as três variáveis `EXPO_PUBLIC_*`; `npx expo start`; abrir no telemóvel com a app **Expo Go** a ler o QR; `EXPO_PUBLIC_API_URL` tem de ser o IP do PC na rede local, ex. `http://192.168.1.20:3000`, e a API a correr).
- [ ] **Step 4:** Suites da API e da app → PASS.
- [ ] **Step 5:** Commit `chore(mobile): verificação visual e documentação`.
- [ ] **Step 6:** Pedir ao Pedro o teste no telemóvel: registo completo, sair, entrar, trocar de modo, adicionar e remover veículo, apagar conta. O Claude confirma no Supabase pelo conector.

## Fora deste plano

Recuperação de password ("Esqueceste-te da password?" fica visível mas desativado com "Em breve"), login Google, fotografia de perfil, ecrãs de mapa/espaços/reservas.
