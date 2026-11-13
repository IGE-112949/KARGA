# Pendentes (pequenos pontos para resolver mais tarde)

Juntados das revisões finais de cada fase. Nenhum bloqueia os testes; resolvem-se quando fizer sentido.

Os pontos das fases de registo/perfil, espaços e mapa/pesquisa foram resolvidos no ramo `feat/perfil-pendentes` (10 nov 2026).

## Para o deploy
- [ ] Link de partilha: passar a apontar para o link da app publicada (`eas update`) em vez do Expo Go do PC.

## Da revisão final do ramo perfil-pendentes (menores)
- [ ] Modo: ao trocar de conta sem sair da app, um frame com o modo da conta anterior; a chave antiga `karga.mode` não é migrada (o modo guardado perde-se uma vez).
- [ ] Registos: a mensagem de alguns erros do Postgres (`cause.message`) pode incluir o valor enviado.
- [ ] `resetTo` só limpa a pilha mais próxima (hoje chega, porque o registo usa `replace`).
- [ ] Seletor de hora: "+" às 23:30 de hoje dá a volta para 00:00 (de hoje); o aviso `?aviso=foto` pode reaparecer se o Perfil voltar a montar.
- [ ] "Esta noite" na noite da mudança de hora da primavera dura 12 h reais (acaba às 09:00).
- [ ] Pesquisa por páginas (OFFSET): se os preços mudarem a meio pode saltar ou repetir um lugar.
- [ ] Fotos e avatares antigos mantêm o caminho com o id do utilizador (só os novos mudaram).
- [ ] Rotas desconhecidas sem token devolvem 401 (com token, 404).

## Site (decisões do grupo)
- [ ] "Sugestões para discutir" do `docs/site-karga-alteracoes.md`: quem paga os 10% (a app e a API já somam os 10% ao total do condutor; só a maqueta do Claude Design mostra 0,50 € fixos), enquadramento legal (DL 93/2025), tolerância na taxa de ocupação, energia sem kit, prazos de cancelamento, seguro.
- [ ] App: o €/kWh pode ser definido mesmo sem tomada inteligente (a tomada está "Em breve"); o site diz que a energia só é cobrada com kit.
- [ ] Lista de espera: ler as inscrições no Supabase (tabela `lista_espera`, só pelo painel ou pela API com a chave secreta).

## Decisões futuras (não são bugs)
- [ ] Apagar a conta (RGPD) com reservas: anonimizar em vez de apagar em cascata (fase das reservas).
- [ ] Mapa com chave do Google Maps quando a app for publicada numa loja.
