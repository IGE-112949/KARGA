# Karga — Alterações à landing page

Site: https://karga-landing-page.vercel.app · Documento de trabalho para quem programa o site · Base: Plano de Marketing (3 Marketing & Comunicação) · Revisto a 13/11/2026

Regras para quem implementa:
- Português de Portugal e tratamento por "você" ("a sua garagem"), como no site atual.
- O site continua HTML estático. A **única** peça que precisa de um serviço externo é o formulário da lista de espera (ver secção 2.14). Tudo o resto é HTML, CSS e JavaScript no próprio browser.
- O modelo de preços não muda: o proprietário define o €/hora, a energia é cobrada a preço de custo (só com kit), o kit é opcional, a taxa de serviço é de 10% sobre lugar + energia e a taxa de ocupação é de 0,10 €/min.
- Todos os números visíveis no site levam uma nota de fonte pequena, com link (classe sugerida `.fonte`, 12 px, cor secundária).

---

## 1. Resumo

- **Público principal:** condutores de carros elétricos que vivem em apartamento sem lugar com tomada. O segundo público, de quem depende o arranque, são os proprietários de um lugar de garagem com tomada em Odivelas e Loures.
- **Mensagem principal:** "Carregue perto de casa, com lugar garantido e o preço total à vista. Quem tem garagem rentabiliza o lugar sem obras."
- **Promessa honesta:** o preço fica ao nível do carregamento público lento (AC). Não vendemos "poupança de 50%"; vendemos conveniência, lugar garantido e privacidade.
- **Ação principal:** inscrever-se na lista de espera, indicando o perfil (condutor ou proprietário) e o código postal.
- **Porquê agora:** a app ainda não está nas lojas. O piloto começa em Odivelas e Loures, por isso cada inscrição com código postal ajuda a decidir onde abrir primeiro.

---

## 2. Secção a secção (ordem final da página)

Ordem nova: 2.1 Faixa de aviso → 2.2 Cabeçalho → 2.3 Hero → 2.4 O problema, em números → 2.5 Maqueta da app → 2.6 Como funciona → 2.7 Para condutores → 2.8 Para proprietários → 2.9 Simulador → 2.10 Quanto custa carregar → 2.11 Equipamento → 2.12 Quem ganha e quem faz o quê → 2.13 Perguntas frequentes → 2.14 Lista de espera → 2.15 Confiança → 2.16 Rodapé

### 2.1 Faixa de aviso (NOVA, topo da página)

**O que muda e porquê:** os Termos e os Contactos já dizem que a Karga é um projeto académico e que o serviço não está disponível. A página principal não o diz, e os botões "Descarregar App" e "Comprar Kit" não levam a lado nenhum. Dizer isto logo no topo evita frustração e dá credibilidade (plano 3.4: comunicar só o que se pode cumprir).

**Texto final:**
> Projeto académico em fase piloto em Odivelas e Loures. A app ainda não está nas lojas: [inscreva-se na lista de espera](#lista-espera) e avisamos quando abrir na sua zona.

Faixa fina, fundo `#ECF8F2`, texto `#065F46`, sem botão de fechar.

### 2.2 Cabeçalho e navegação

**O que muda e porquê:** "Descarregar App" aponta para `#` e não faz nada. Passa a ser a ação principal do plano (lista de espera). O menu ganha entradas para cada público.

**Menu:** `Como funciona` (#como-funciona) · `Condutores` (#condutores) · `Proprietários` (#proprietarios) · `Simulador` (#simulador) · `Perguntas` (#perguntas)

**Botão (destaque):** `Entrar na lista de espera` → `#lista-espera`

### 2.3 Hero

**O que muda e porquê:** hoje o hero fala primeiro ao proprietário ("Rentabilize a sua garagem") e o segundo botão é "Comprar Hardware", que não funciona. O plano (3.1.3) põe o condutor sem garagem em primeiro lugar e o proprietário logo a seguir. A promessa passa a ser lugar garantido, preço à vista e privacidade, que o produto já cumpre. "Sem taxas escondidas" mantém-se, mas a taxa de 10% passa a aparecer explicitamente.

**Subtítulo pequeno (acima do título):** Carregamento partilhado entre vizinhos · Portugal

**Título:** Carregue perto de casa. Rentabilize a sua garagem.

**Texto:**
> A Karga liga condutores de carros elétricos a vizinhos com um lugar de garagem e uma tomada. O condutor reserva um lugar garantido, a poucos minutos de casa, e vê o preço total antes de confirmar. O proprietário põe a render um lugar que já tem, sem obras.

**Botões:**
- Principal: `Tenho carro elétrico` → `#lista-espera` com perfil "Condutor" pré-selecionado (ver 6)
- Secundário: `Tenho garagem com tomada` → `#lista-espera` com perfil "Proprietário" pré-selecionado

**Três destaques (substituem os atuais):**
- **Lugar garantido** durante a reserva
- **Morada protegida:** só quem reserva a vê
- **Preço total à vista:** lugar, energia e taxa de 10%

### 2.4 O problema, em números (NOVA)

**O que muda e porquê:** o site não mostra nenhum dado real. O plano (3.1.1 e 3.2.1) assenta em dois factos: cada vez mais pessoas compram carros elétricos, e carregar fora de casa custa bastante mais. Três números com fonte dão credibilidade sem exagero.

**Título:** Cada vez mais elétricos. Nem todos têm onde carregar.

**Cartões (número grande + legenda + fonte):**

| Número | Legenda (texto final) | Fonte (link na nota) |
| --- | --- | --- |
| **29%** | dos carros novos vendidos em Portugal entre janeiro e setembro de 2026 eram 100% elétricos. | ACAP, via Forbes Portugal, out. 2026 |
| **8,09 € vs 3,19 €** | custo de 100 km na rede pública contra o carregamento em casa. | DECO Proteste, jan. 2026 |
| **44%** | dos condutores de elétricos em seis países europeus não têm ponto de carregamento em casa. | Shell Recharge Survey, 2023 (Reino Unido, Alemanha, França, Itália, Bélgica e Países Baixos; não inclui Portugal) |

**Frase por baixo:**
> Quem vive num prédio sem lugar com tomada depende de haver um posto livre. Há lugares de garagem com tomada parados a maior parte do dia. A Karga junta as duas coisas.

Nota de implementação: o terceiro cartão tem de manter o texto "em seis países europeus". Não há dado público equivalente para Portugal, e o site não deve sugerir que há.

### 2.5 Maqueta da app

**O que muda e porquê:** a maqueta atual (Joana, Garagem do Rui, Casa da Marta) mostra 3,7 kW e 7,4 kW e um botão "Reservar carregamento". Passa a usar o ecrã de reserva do protótipo oficial (Karga APP — Protótipo, ecrã "detail"), que já mostra o que queremos provar: preço por hora, energia a custo, resumo de custos e aviso da taxa de ocupação.

**Imagem:** exportar o ecrã "Detalhe / Reservar" do protótipo (exemplo Garagem da Rita, hoje 21:00, 8 h). Se a exportação não for possível, manter a maqueta atual mas pôr a legenda abaixo.

**Legenda (obrigatória):** Ecrã ilustrativo do protótipo. Nomes e valores são exemplos.

**Texto alternativo (alt):** Ecrã da app Karga com o detalhe de um lugar de garagem, a escolha do horário, o resumo de custos e o botão Reservar.

> Atenção: o protótipo mostra uma taxa de serviço fixa de 0,50 €. O site usa 10%. Ver "Sugestões para discutir", ponto 1.

### 2.6 Como funciona

**O que muda e porquê:** o passo 1 atual é "Ligar o kit", mas o kit é opcional e sem ele o investimento é zero. A secção passa a ter dois separadores, Condutor e Proprietário, com três passos cada. Isto segue a jornada do plano (3.3.2).

**Título:** Como funciona

**Separador "Sou condutor":**
1. **Encontre um lugar perto de si.** Veja no mapa os lugares disponíveis, com preço por hora, potência e tipo de ficha.
2. **Reserve com o preço à vista.** Escolha a hora de chegada e a duração. A app mostra o custo estimado antes de confirmar: lugar, energia e taxa de serviço.
3. **Chegue, ligue e carregue.** A morada exata e as instruções de acesso aparecem depois da reserva. O pagamento é feito na app.

**Separador "Tenho garagem":**
1. **Publique o seu lugar.** Indique a morada, a potência da tomada e o preço por hora. Sem kit, o investimento é zero.
2. **Defina quando está livre.** Escolha os dias e os horários. Só recebe reservas nessas janelas.
3. **Receba por cada reserva.** O pagamento é feito pela app. Com tomada inteligente, a energia é medida e cobrada ao seu preço de custo.

### 2.7 Para condutores (NOVA, âncora `#condutores`)

**O que muda e porquê:** hoje não há nenhum bloco só para o condutor, que é o público principal do plano (3.2.3). Os benefícios são os do posicionamento (3.1.3).

**Título:** Para quem não tem onde carregar em casa

**Benefícios (4 cartões):**
- **Lugar garantido.** O lugar é seu durante o período reservado. Não há posto ocupado à chegada.
- **Noite inteira, sem pressa.** Reserve várias horas e carregue enquanto dorme, ao preço por hora definido pelo proprietário.
- **Preço total antes de reservar.** Lugar, energia a preço de custo e taxa de serviço de 10%, tudo visível antes de confirmar.
- **Perto de casa.** Lugares em garagens de vizinhos, na sua zona.

**Responsabilidades (linha por baixo, texto pequeno):**
> Use o lugar só no período reservado, deixe-o como o encontrou e respeite as regras do prédio. Depois da hora de fim aplica-se uma taxa de ocupação de 0,10 €/min.

**Botão:** `Quero carregar perto de casa` → `#lista-espera` (perfil Condutor)

### 2.8 Para proprietários (NOVA, âncora `#proprietarios`)

**O que muda e porquê:** o proprietário é o lado difícil do marketplace (plano 3.3.1). As barreiras dele são estranhos na garagem, a morada exposta, carros que ficam horas a mais e o condomínio (plano 3.3.2). Cada benefício responde a uma dessas barreiras, e as responsabilidades ficam claras, como nos Termos.

**Título:** Tem um lugar com tomada parado? Ponha-o a render.

**Benefícios (4 cartões):**
- **Investimento zero.** Publique o lugar sem kit e cobre só à hora. O kit é opcional e pode ser adicionado mais tarde.
- **Você decide.** Define o preço por hora, os dias e os horários. Desativa o lugar quando quiser.
- **A sua morada fica protegida.** Antes da reserva, os condutores veem só uma zona aproximada (um círculo de cerca de 150 m). A morada exata e o código de acesso são mostrados apenas a quem reservar.
- **Sem carros esquecidos.** Depois da hora de fim, o condutor paga 0,10 €/min de taxa de ocupação.

**Responsabilidades (caixa "O que lhe pedimos"):**
- Publique só lugares que tem direito a ceder: é o dono, é arrendatário com autorização ou tem permissão do condomínio.
- Mantenha a instalação elétrica em bom estado e adequada à potência anunciada.
- Garanta que horários, preços e fotos correspondem à realidade.
- Dê o código de acesso apenas ao condutor com reserva.
- Se cancelar (por avaria ou emergência), avise o condutor. Ele recebe o reembolso total.

**Nota sobre o condomínio (texto pequeno, com fonte):**
> Desde o Decreto-Lei n.º 93/2025, qualquer condómino pode instalar um carregador no seu lugar mediante comunicação escrita à administração com 30 dias de antecedência. Ceder o lugar a outras pessoas pode estar sujeito ao regulamento do prédio: confirme-o antes de publicar.

Fonte: PLMJ, jan. 2026.

**Botões:**
- `Simular quanto posso ganhar` → `#simulador`
- `Pré-registar o meu lugar` → `#lista-espera` (perfil Proprietário)

### 2.9 Simulador de ganhos

**O que muda e porquê:**
1. **O cálculo está errado.** Com os valores por defeito (3 sessões × 4 h × 4 semanas × 0,50 €/h), a fórmula dá 24 €/mês, mas o site mostra 48 €/mês e 576 €/ano. Uma promessa de ganho inflacionada é o maior risco de credibilidade junto dos proprietários.
2. **A potência da "tomada normal" está errada.** O Kit Básico está limitado a 10 A (cerca de 2,3 kW) e o site diz 3,7 kW.
3. **Os valores por defeito mudam** para o cenário do plano: 2 noites por semana, 10 h, 0,30 €/h. Dão os mesmos 24 €/mês da mensagem aos proprietários (plano 3.3.3).

**Título:** Quanto pode ganhar com o seu lugar?

**Subtítulo:** Estimativa do valor do aluguer. A energia é cobrada ao seu preço de custo: não é lucro, apenas o reembolso do que gasta.

**Controlos (rótulos finais):**

| Controlo | Opções / intervalo | Por defeito |
| --- | --- | --- |
| Tipo de tomada | `Tomada normal (até 2,3 kW)` · `Wallbox (até 7,4 kW)` | Tomada normal |
| Reservas por semana | 1 a 10 | 2 |
| Horas por reserva | 1 a 12 | 10 |
| Preço do lugar | 0,20 € a 1,50 € por hora, passos de 0,05 € | 0,30 €/h |

**Dica por baixo do preço (muda com o tipo de tomada):**
- Tomada normal: `Numa tomada normal o carro carrega devagar. Preços entre 0,20 € e 0,30 €/h mantêm a Karga competitiva com a rede pública.`
- Wallbox: `Com wallbox o carregamento é mais rápido e preços até 0,50 €/h continuam competitivos.`

**Resultados (cálculo em JavaScript):**

```
horasMes     = horasPorReserva × reservasPorSemana × 4
ganhoMes     = precoHora × horasMes
ganhoAno     = ganhoMes × 12
kwhMaxMes    = potencia × horasMes      // potencia: 2,3 ou 7,4 kW
```

Com os valores por defeito: **24,00 € por mês · 288 € por ano · 80 h por mês · até 184 kWh por mês**.

**Rótulos dos resultados:**
- `Ganho estimado por mês`
- `Por ano`
- `Horas de aluguer por mês`
- `Energia fornecida (máx.) — paga ao seu preço de custo`

**Nota (texto pequeno):**
> Estimativa antes de impostos. Os valores dependem das reservas que receber. Sem kit, a energia não é faturada: tenha isso em conta ao definir o preço por hora.

**Botão:** `Pré-registar o meu lugar` → `#lista-espera` (perfil Proprietário)

### 2.10 Quanto custa carregar (substitui "Compare e Poupe")

**O que muda e porquê:**
1. **A conta da Karga está incompleta.** Faltam os 10% de taxa: 3,20 € + 2,00 € = 5,20 €, mas com a taxa são 5,72 €.
2. **Os números não batem com o kit.** 20 kWh em 4 h exigem cerca de 5 kW, e o Kit Básico dá cerca de 2,3 kW.
3. **A comparação não é justa.** O valor de "~0,55 €/kWh" é o de um carregador rápido, e "Poupança de 50%" compara com esse preço. Contra o carregamento público lento (AC), a diferença é pequena.
4. **Há uma referência desatualizada.** As "taxas CEME" desaparecem com o novo regime da mobilidade elétrica (DL 93/2025).

O plano (3.2.4) diz para comunicar conveniência, não poupança. A tabela passa a comparar o custo por kWh, com cenários realistas.

**Título:** Preço de rede pública, com lugar garantido à porta de casa

**Subtítulo:** Custo total por kWh, com tudo incluído.

**Tabela (texto final):**

| Opção | Custo por kWh | Exemplo | O que inclui |
| --- | --- | --- | --- |
| Rede pública, carregamento normal (AC, até 22 kW) | 0,25–0,45 € | 20 kWh: 5,00–9,00 € | Depende do posto e do operador; pode haver taxas por tempo |
| Rede pública, carregamento rápido (DC, até 50 kW) | 0,45–0,65 € | 20 kWh: 9,00–13,00 € | Mais rápido, mais caro |
| **Karga com wallbox** (7,4 kW) | **0,31 €** | 20 kWh em 3 h a 0,50 €/h: **6,27 €** | Lugar 1,50 € + energia 4,20 € + taxa 10% (0,57 €) |
| **Karga, uma noite em tomada normal** (2,3 kW) | **0,37 €** | 23 kWh em 10 h a 0,30 €/h: **8,61 €** | Lugar 3,00 € + energia 4,83 € + taxa 10% (0,78 €); lugar garantido a noite toda |

**Notas (texto pequeno, por baixo):**
> Energia da Karga calculada a 0,21 €/kWh (tarifa simples regulada com IVA, out.–dez. 2026). Cada proprietário indica o seu preço de custo, que pode ser mais baixo em tarifa bi-horária. O preço por hora é definido pelo proprietário. Na rede pública, alguns operadores cobram tempo de ocupação: por exemplo, 0,20 €/min após 15 minutos nos postos do Continente.

Fontes: e-konomista (mar. 2026) para os preços da rede pública; Literacia Financeira (out. 2026) para a tarifa; e-konomista (jul. 2026) para a taxa de ocupação.

**Vantagens da Karga (lista ao lado da tabela, substitui a atual):**
- Lugar privado e garantido durante a reserva
- Pode ficar a noite inteira
- Preço total visível antes de reservar
- Pagamento na app

Retirar: "Poupança de 50%", "Rede Pública de Rua (~0,55 €/kWh)" e "taxas CEME/OPC".

**Botão:** `Quero carregar perto de casa` → `#lista-espera` (perfil Condutor)

### 2.11 Equipamento

**O que muda e porquê:**
1. O Kit Básico anuncia "até 7,4 kW", mas está limitado a 10 A, que é cerca de 2,3 kW. Isto tem de ser corrigido.
2. A opção sem kit (investimento zero) aparece só numa frase. Passa a ser o primeiro cartão.
3. Os botões "Comprar Kit" e "Agendar Instalação" apontam para `#`. Passam a ser pré-reservas na lista de espera, sem pagamento.

**Título:** Escolha como quer cobrar

**Subtítulo:** O kit é opcional. Pode começar sem ele e acrescentá-lo mais tarde, sem mudar o anúncio.

**Cartão 1 — Sem kit · 0 €**
- O lugar é cobrado à hora
- A energia não é faturada
- Ideal para começar sem investimento
- Botão: `Pré-registar o meu lugar` → `#lista-espera` (perfil Proprietário, kit = Sem kit)

**Cartão 2 — Kit Básico · 24,90 € (pagamento único) · etiqueta "Recomendado"**
- Tomada inteligente Shelly Plus Plug S, ligada à tomada que já tem
- Mede a energia em tempo real: o condutor paga os kWh ao seu preço de custo
- Instalação zero
- Limitada a 10 A (cerca de 2,3 kW) por segurança
- Botão: `Pré-reservar Kit Básico` → `#lista-espera` (perfil Proprietário, kit = Básico)

**Cartão 3 — Kit Pro · 249,99 € (instalação incluída)**
- Tomada reforçada de 16 A ou módulo no quadro elétrico
- Instalação por eletricista certificado
- Carregamento até 32 A, para uso intensivo
- Botão: `Pedir Kit Pro` → `#lista-espera` (perfil Proprietário, kit = Pro)

**Nota por baixo:**
> Os kits ainda não estão à venda. A pré-reserva não tem custo nem compromisso: avisamos quando estiverem disponíveis. O kit fica sempre seu.

### 2.12 Quem ganha e quem faz o quê (NOVA)

**O que muda e porquê:** o objetivo pedido é deixar claras as responsabilidades e os benefícios de cada interessado. No site entra como uma secção com separadores ou um acordeão, com o conteúdo das tabelas da secção 3 deste documento.

**Título:** Quem ganha e quem faz o quê

**Subtítulo:** Regras simples, iguais para todos. A versão completa está nos [Termos e Condições](termos.html).

Conteúdo: as quatro tabelas da secção 3 (Condutor, Proprietário, Condomínio, Karga). A tabela "Municípios e operadores de energia" fica só neste documento e não vai para o site.

### 2.13 Perguntas frequentes (NOVA, âncora `#perguntas`)

Conteúdo final: secção 4 deste documento. Formato acordeão (`<details><summary>`), sem JavaScript.

**Título:** Perguntas frequentes

**Fim da secção:** `Ainda tem dúvidas?` + botão `Escreva-nos` → `mailto:ola@karga.pt`

### 2.14 Lista de espera (NOVA, âncora `#lista-espera`) — precisa de serviço externo

**O que muda e porquê:** hoje não há forma de captar contactos, por isso nenhuma ação do plano consegue medir resultados. O objetivo SMART (plano 3.3.1) é ter 100 inscritos com código postal: 80 condutores e 20 proprietários. Este formulário é o destino de todos os botões da página.

**Título:** Entre na lista de espera

**Subtítulo:** Estamos a começar por Odivelas e Loures. Deixe o seu código postal e avisamos quando a Karga abrir na sua zona.

**Campos:**

| Campo | Tipo | Obrigatório | Rótulo / opções |
| --- | --- | --- | --- |
| perfil | rádio | sim | `Tenho carro elétrico` · `Tenho garagem com tomada` · `As duas coisas` |
| nome | texto | sim | Primeiro nome |
| email | email | sim | Email |
| codigo_postal | texto, padrão `^\d{4}-\d{3}$` | sim | Código postal (ex.: 2675-123) |
| ve_situacao | rádio (só condutor) | não | `Já tenho carro elétrico` · `Vou comprar nos próximos 12 meses` |
| carrega_onde | rádio (só condutor) | não | `Rede pública` · `No trabalho` · `Em casa de familiares` · `Outro` |
| tipo_lugar | rádio (só proprietário) | não | `Box fechada` · `Lugar em garagem coletiva` · `Lugar exterior` |
| tomada | rádio (só proprietário) | não | `Já tenho tomada no lugar` · `Tenho wallbox` · `Ainda não tenho` |
| kit | rádio (só proprietário) | não | `Sem kit` · `Kit Básico` · `Kit Pro` · `Ainda não sei` |
| consentimento | checkbox | sim | `Aceito que a Karga guarde estes dados para me contactar sobre o lançamento, nos termos da` [Política de Privacidade](privacidade.html)`.` |
| utm_source, utm_medium, utm_campaign | ocultos | — | lidos do URL por JavaScript |
| criado_em | automático | — | data e hora do envio |

Os campos "só condutor" e "só proprietário" aparecem ou desaparecem conforme o perfil escolhido. Com "As duas coisas", aparecem todos.

**Botão:** `Inscrever-me`

**Mensagem de sucesso (substitui o formulário):**
> Obrigado, [nome]! Está na lista. Vamos avisá-lo por email quando a Karga abrir na sua zona. Não enviamos publicidade de terceiros.

**Mensagem de erro:** `Não foi possível enviar. Tente de novo ou escreva-nos para ola@karga.pt.`

**Implementação (escolher uma opção):**
- **Opção A, recomendada:** Supabase, que a Política de Privacidade já indica como prestador na UE. Tabela `lista_espera` com os campos acima. RLS ativo, com política de `insert` para `anon` e sem `select` público. O site faz o `insert` com a chave pública (anon). Não guardar a chave de serviço no site.
- **Opção B:** um serviço de formulários (Tally, Formspree ou Google Forms) com envio por POST ou embed. Exige acrescentar esse prestador à Política de Privacidade.

**Pré-seleção a partir dos botões:** os links usam `#lista-espera?perfil=condutor` (ou `proprietario`) e `&kit=basico` (ou `pro`, `sem`). Um pequeno script lê estes parâmetros, marca os rádios certos e faz scroll até ao formulário.

### 2.15 Confiança (NOVA)

Conteúdo final: secção 5 deste documento. Uma faixa com 4 a 5 blocos curtos, ícone + título + uma frase.

### 2.16 Rodapé

**O que muda:** passa a identificar o projeto académico e a ter o Livro de Reclamações, que os Termos já referem.

**Texto final:**
> Karga — carregamento partilhado entre vizinhos. Projeto académico da unidade curricular de Empreendedorismo e Inovação, ISCTE – Instituto Universitário de Lisboa, 2026/2027. Serviço ainda não disponível comercialmente.

**Links:** `Termos e Condições` · `Privacidade` · `Contactos` · `Livro de Reclamações` (https://www.livroreclamacoes.pt)

**Linha final:** © 2026 Karga.

**Página Contactos:** retirar o telefone +351 210 000 000. É um número provisório, e ter um telefone sem atendimento real tira confiança. Ficam só os emails.

---

## 3. Quem ganha e quem faz o quê

Coerente com os Termos e Condições (cl. 1–10) e com a Política de Privacidade do site. Onde os Termos não dizem nada, está assinalado.

### Condutor

| Benefícios | Responsabilidades |
| --- | --- |
| Lugar garantido durante a reserva | Ter 18 anos ou mais e dados verdadeiros na conta |
| Custo estimado visível antes de reservar; valor final calculado no fim da sessão | Usar o lugar só no período reservado |
| Energia ao preço de custo do proprietário, sem margem (só em lugares com kit) | Deixar o lugar como o encontrou |
| Reembolso total se o proprietário cancelar | Pagar 0,10 €/min de taxa de ocupação depois da hora de fim |
| Pagamento na app | Cumprir as instruções de acesso e as regras do prédio ou da garagem |
| Pode apagar a conta a qualquer momento (Perfil › Apagar conta) | Guardar a password |

### Proprietário

| Benefícios | Responsabilidades |
| --- | --- |
| Rendimento de um lugar parado, ao preço por hora que define | Publicar só lugares que tem direito a ceder (dono, arrendatário com autorização ou permissão do condomínio) |
| Investimento zero sem kit; o kit é opcional e fica seu | Manter a instalação elétrica em bom estado e adequada à potência anunciada |
| Com kit, a energia é medida e reembolsada ao seu preço de custo | Garantir que horários, preços e fotos correspondem à realidade |
| Morada protegida: antes da reserva só se vê uma zona de cerca de 150 m | Dar o código de acesso apenas a quem tem reserva |
| Só o primeiro nome e a inicial do apelido são partilhados com o condutor | Em caso de cancelamento (avaria, emergência), avisar o condutor, que recebe o reembolso total |
| Taxa de ocupação de 0,10 €/min para quem fica depois da hora | Kit Pro instalado só por eletricista certificado |

### Condomínio / administração do prédio

| O que ganha | O que lhe pode caber |
| --- | --- |
| Sem obras nas partes comuns quando o lugar usa a tomada e o contador do próprio condómino | Definir no regulamento interno as regras de acesso de terceiros à garagem |
| Acesso dado só a condutores identificados e com reserva, com código entregue apenas a eles | Receber a comunicação escrita do condómino que instala um carregador (30 dias de antecedência, DL 93/2025) |
| Um serviço que valoriza os lugares de garagem do prédio | Dar permissão, quando o lugar não é do condómino que o publica |

Nota: os Termos não criam obrigações para o condomínio. Esta tabela descreve a relação prática e o enquadramento legal, não deveres perante a Karga.

### Karga

| O que faz | O que não faz |
| --- | --- |
| Mostra os lugares, gere reservas e pagamentos | Não é operadora de pontos de carregamento da rede pública |
| Mede a energia quando há tomada inteligente | Não responde por falhas de energia nem pela instalação elétrica do proprietário |
| Mostra o custo estimado antes da reserva e calcula o valor final no fim | Não vende dados pessoais |
| Cobra uma taxa de serviço de 10% sobre lugar + energia | Não resolve sozinha os danos: são tratados entre condutor e proprietário, com o apoio da Karga e dos seguros de cada um, quando aplicável |
| Apoia a resolução de problemas entre utilizadores | — |
| Pode suspender contas que violem os Termos ou ponham pessoas ou bens em risco | — |

### Municípios e operadores de energia (só neste documento, não vai para o site)

| O que podem receber | Condição |
| --- | --- |
| Estatísticas agregadas da procura de carregamento por zona e horário | Só dados que não identificam ninguém, como prevê a Política de Privacidade |

---

## 4. Perguntas frequentes (texto final para o site)

**1. A Karga já está disponível?**
Ainda não. É um projeto académico em fase piloto em Odivelas e Loures. Inscreva-se na lista de espera e avisamos quando a app abrir na sua zona.

**2. Quanto posso ganhar com o meu lugar?**
Depende do preço por hora e das reservas que receber. Por exemplo, 2 noites por semana, 10 horas cada, a 0,30 €/h dão cerca de 24 € por mês. Use o [simulador](#simulador) com os seus valores. A energia não é lucro: com kit, é reembolsada ao seu preço de custo.

**3. Preciso de comprar o kit?**
Não. Sem kit, o lugar é cobrado à hora e a energia não é faturada, por isso tenha-a em conta no preço. Com o Kit Básico (24,90 €), a energia é medida e o condutor paga os kWh ao seu preço de custo.

**4. Como funciona o pagamento da energia?**
Só há cobrança de energia em lugares com tomada inteligente. Paga-se o consumo medido em kWh, ao preço de custo indicado pelo proprietário, sem margem. A isto somam-se o preço do lugar e a taxa de serviço de 10%.

**5. Um desconhecido vai saber onde moro?**
Antes de reservar, o condutor vê só uma zona aproximada (um círculo de cerca de 150 m) e o nome da localidade. A morada exata e o código de acesso são mostrados apenas a quem reservar. Do proprietário, o condutor vê o primeiro nome e a inicial do apelido.

**6. E se o condutor se atrasar a sair?**
Depois da hora de fim da reserva, o condutor paga uma taxa de ocupação de 0,10 € por minuto. O valor é cobrado automaticamente na app.

**7. E se houver danos no lugar ou no carro?**
Cada utilizador responde pelo que faz. Os danos resolvem-se entre proprietário e condutor, com o apoio da Karga e dos seguros de cada um, quando aplicável. A Karga não inclui seguro próprio: recomendamos confirmar a sua cobertura com a seguradora.

**8. Posso cancelar uma reserva?**
As condições de cancelamento e reembolso aparecem na app no momento da reserva. Se for o proprietário a cancelar, o condutor recebe sempre o reembolso total.

**9. O condomínio tem de autorizar?**
Só pode publicar lugares que tem direito a ceder: é o dono, é arrendatário com autorização ou tem permissão do condomínio. Para instalar um carregador no seu lugar, basta comunicar por escrito à administração com 30 dias de antecedência (DL 93/2025). Confirme também o regulamento do prédio sobre o acesso de terceiros.

**10. A Karga é uma rede pública de carregamento?**
Não. A Karga é uma intermediária: mostra lugares privados, gere reservas e pagamentos e mede a energia quando há tomada inteligente. Não é operadora de pontos de carregamento da rede pública.

---

## 5. Confiança e prova (sem inventar)

Blocos para a faixa de confiança (2.15). Cada um tem título e uma frase. Nada de testemunhos, avaliações, número de utilizadores ou logótipos de "parceiros".

| Título | Texto final | Base |
| --- | --- | --- |
| **Projeto académico ISCTE** | Desenvolvido na unidade curricular de Empreendedorismo e Inovação do ISCTE, em 2026/2027. | Facto do projeto; os Termos e os Contactos já falam em projeto académico |
| **Piloto em Odivelas e Loures** | Começamos onde vivemos, bairro a bairro, antes de crescer para o resto do país. | Plano de marketing |
| **Morada protegida** | A morada exata só é mostrada a quem reserva. Antes disso, vê-se uma zona de cerca de 150 m. | Política de Privacidade |
| **Preço à vista e pagamento na app** | O custo estimado aparece antes de reservar, e tudo é pago na app, sem dinheiro em mão. | Termos, cl. 6 |
| **Os seus dados na Europa** | Dados guardados na UE. Não vendemos dados pessoais. Pode apagar a conta a qualquer momento. | Política de Privacidade |

Proibido no site enquanto não houver dados reais: "milhares de utilizadores", estrelas e avaliações, citações de clientes, "parceiro oficial" de qualquer marca, "certificado" ou "licenciado".

---

## 6. Chamadas à ação

A app não está nas lojas e os kits não estão à venda. Todos os botões levam à lista de espera, com o perfil pré-selecionado, ou a uma âncora da página.

| Local | Texto do botão | Destino | O que acontece |
| --- | --- | --- | --- |
| Faixa de aviso | link "inscreva-se na lista de espera" | `#lista-espera` | Scroll até ao formulário |
| Cabeçalho | `Entrar na lista de espera` | `#lista-espera` | Scroll até ao formulário |
| Hero (principal) | `Tenho carro elétrico` | `#lista-espera?perfil=condutor` | Formulário com o perfil Condutor marcado |
| Hero (secundário) | `Tenho garagem com tomada` | `#lista-espera?perfil=proprietario` | Formulário com o perfil Proprietário marcado |
| Para condutores | `Quero carregar perto de casa` | `#lista-espera?perfil=condutor` | Idem |
| Para proprietários | `Simular quanto posso ganhar` | `#simulador` | Scroll até ao simulador |
| Para proprietários | `Pré-registar o meu lugar` | `#lista-espera?perfil=proprietario` | Idem |
| Simulador | `Pré-registar o meu lugar` | `#lista-espera?perfil=proprietario` | Idem |
| Quanto custa carregar | `Quero carregar perto de casa` | `#lista-espera?perfil=condutor` | Idem |
| Equipamento, Sem kit | `Pré-registar o meu lugar` | `#lista-espera?perfil=proprietario&kit=sem` | Perfil e kit marcados |
| Equipamento, Kit Básico | `Pré-reservar Kit Básico` | `#lista-espera?perfil=proprietario&kit=basico` | Perfil e kit marcados; não há pagamento |
| Equipamento, Kit Pro | `Pedir Kit Pro` | `#lista-espera?perfil=proprietario&kit=pro` | Perfil e kit marcados; não há pagamento |
| Perguntas frequentes | `Escreva-nos` | `mailto:ola@karga.pt` | Abre o email |
| Formulário | `Inscrever-me` | envio para o serviço da lista de espera | Mensagem de sucesso |

Retirar: `Descarregar App` (→ `#`), `Comprar Hardware`, `Comprar Kit` (→ `#`), `Agendar Instalação` (→ `#`), `Começar a faturar`, `Reservar carregamento` na maqueta.

Se quiserem mostrar as lojas, usar um texto sem link: `Em breve na App Store e no Google Play`. Não usar os logótipos oficiais das lojas antes de a app lá estar.

**Medição:** cada link externo usado nas ações do plano (cartazes com QR, grupos de Facebook e WhatsApp, Meta Ads) leva parâmetros UTM, por exemplo `?utm_source=qr&utm_medium=cartaz&utm_campaign=condominios`. O formulário guarda-os nos campos ocultos.

---

## Sugestões para discutir (não implementar sem decisão do grupo)

1. **Quem paga os 10%.** Os Termos dizem "10% sobre o lugar e a energia", mas não dizem quem paga. O protótipo da app soma a taxa ao total do condutor e usa um valor fixo de 0,50 €, não 10%. O site, neste documento, assume que os 10% são somados ao total do condutor e que o ganho do proprietário não é reduzido. É preciso confirmar e alinhar Termos, app e site.
2. **Enquadramento legal.** O DL 93/2025 cria a figura do operador de ponto de carregamento, com licença da DGEG. Não está confirmado se um particular que cede a tomada fica abrangido. Antes de ativar pagamentos reais, pedir um parecer. Até lá, o site fala só em "lista de espera" e "pré-registo", como neste documento.
3. **Tolerância na taxa de ocupação.** O Continente só cobra a ocupação após 15 minutos. Uma tolerância de 10 a 15 minutos podia reduzir conflitos. Isto muda a regra dos 0,10 €/min, por isso só avança com decisão do grupo.
4. **Energia sem kit.** Sem kit, o proprietário paga a energia do condutor. Poderia haver uma "energia estimada incluída no preço por hora", sugerida pela app conforme a potência. Mantém o modelo, mas ajuda o proprietário a não perder dinheiro.
5. **Cancelamentos do condutor.** Os Termos não têm prazos. Definir uma regra simples, por exemplo grátis até 2 h antes, e mostrá-la no site.
6. **Seguro.** Os Termos não indicam seguro. Uma parceria com uma seguradora seria o argumento de confiança mais forte para proprietários. Fica para depois do piloto.
7. **Pequena incoerência no plano de marketing.** O exemplo da noite (23 kWh, 0,30 €/h) dá 8,61 € com energia a 0,21 €/kWh. O plano diz 8,62 €, porque usou 0,2105 €/kWh. Basta alinhar um dos dois.

---

## 7. Fontes

Dados usados no site:
- ACAP, via Forbes Portugal (05/10/2026) — 29% de elétricos nas vendas de ligeiros de passageiros, jan.–set. 2026: https://www.forbespt.com/?p=196390
- DECO Proteste (16/01/2026) — custo por 100 km: rede pública 8,09 €, casa 3,19 €: https://www.deco.proteste.pt/auto/carros-eletricos/noticias/carros-eletricos-vendem-mais-apoios-carregamento-continuam-problema
- Shell Recharge Survey 2023, via DJS Research — 44% sem ponto de carregamento em casa, em seis países europeus: https://www.djsresearch.co.uk/AutomotiveMarketResearchInsightsAndFindings/article/44percent-of-EV-drivers-do-not-have-a-charge-point-at-home-finds-survey-05390
- e-konomista (05/03/2026) — preços da rede pública (AC 0,25–0,45 €/kWh; DC 0,45–0,65 €/kWh): https://www.e-konomista.pt/quanto-custa-carregar-carro-eletrico/
- e-konomista (31/07/2026) — taxa de ocupação de 0,20 €/min após 15 min nos postos do Continente: https://www.e-konomista.pt/carregar-eletrico-fora-de-casa/
- Literacia Financeira (out. 2026) — tarifa simples regulada de 0,1711 €/kWh sem IVA (≈0,21 € com IVA): https://www.literaciafinanceira.pt/artigos/preco-kwh
- PLMJ (jan. 2026) — DL 93/2025 e carregadores em condomínio (comunicação com 30 dias): https://www.plmj.com/xms/files/02_Artigos_e_Entrevistas/2026/jan_2026_vj.pdf
- Abreu Advogados (ago. 2025) — novo regime jurídico da mobilidade elétrica (fim do CEME, operador de ponto de carregamento): https://abreuadvogados.com/wp-content/uploads/2025/08/Novo-Regime-Juridico-da-Mobilidade-Eletrica-PDF-PT.pdf

Páginas do próprio site:
- Landing page: https://karga-landing-page.vercel.app
- Termos e Condições: https://karga-landing-page.vercel.app/termos.html
- Política de Privacidade: https://karga-landing-page.vercel.app/privacidade.html
- Contactos: https://karga-landing-page.vercel.app/contactos.html
- Livro de Reclamações Eletrónico: https://www.livroreclamacoes.pt
