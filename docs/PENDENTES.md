# Pendentes (pequenos pontos para resolver mais tarde)

Juntados das revisões finais de cada fase. Nenhum bloqueia os testes; resolvem-se quando fizer sentido.

## Registo e perfil
- [ ] Android: o botão "voltar" a partir do Perfil não sai da app (o ecrã de boas-vindas fica por baixo).
- [ ] Browser: o aviso "foto não guardada" (Alert) não aparece.
- [ ] Login: "Email not confirmed" e falhas de rede mostram mensagem genérica.
- [ ] Login: o botão "Entrar" volta a ficar ativo por um instante antes de navegar.
- [ ] Perfil: o cartão de mudar de modo não tem proteção contra duplo toque.
- [ ] O modo (condutor/proprietário) guardado é partilhado entre contas no mesmo telemóvel.
- [ ] Ecrã em branco se as fontes falharem a carregar (improvável, vêm com a app).
- [ ] Pedidos sem token (Auth em baixo) vão para a API e o 401 termina a sessão.
- [ ] Erros inesperados em botões (ex.: abrir a galeria) ficam só como avisos.
- [ ] API: corpos > 100 kB dão 500; rotas desconhecidas devolvem 404 em HTML.
- [ ] API: PATCH /me em simultâneo pode dar 500 em vez de 400; linha apagada a meio de um pedido dá 500.
- [ ] API: token ainda válido depois de apagar a conta faz POST /me dar 500.
- [ ] API: falha de rede ao obter as chaves do Supabase (JWKS) dá 401 em vez de 503.
- [ ] API: "Bearer" sensível a maiúsculas; os registos podem incluir números de telemóvel.
- [ ] Utilizador sem perfil não consegue apagar a conta de Auth.

## Espaços do proprietário
- [ ] Editar um espaço exatamente enquanto é eliminado pode voltar a ativá-lo (raro).
- [ ] Bloquear datas: se a gravação falhar, o formulário fecha e perde o que foi escolhido.
- [ ] Cartão da lista mostra a energia só com 2 casas decimais.
- [ ] "Usar a minha localização atual" não mostra que está a carregar.
- [ ] O interruptor "Visível no mapa" volta atrás por um instante antes de mudar.
- [ ] Preço como 0,333 é gravado como 0,33 sem aviso.
- [ ] Falha do Storage dá erro 500 genérico; uma 6.ª foto chega a ser enviada antes de ser recusada.
- [ ] Endereço público das fotos inclui o id do proprietário (retirar antes de os condutores verem fotos).
- [ ] Ficheiro enviado com o nome de campo errado dá "demasiadas fotografias" em vez de "imagem inválida".
- [ ] Potência fora das opções da app (só via API) perde-se ao editar.
- [ ] Falta teste para "a base de dados falha depois do envio das fotos".
- [ ] Assistente: a barra de separadores continua visível (no mockup é ecrã inteiro); tocar em "Espaços" a meio perde o rascunho sem perguntar.
- [ ] Bloqueios no passado e sobrepostos são aceites.
- [ ] "Adicionar fotografia": opção de tirar foto com a câmara (além da galeria).

## Mapa, pesquisa e favoritos
- [ ] Mudança de hora (2 noites por ano): janelas a começar entre a 01:00 e as 02:00 calculam mal a duração.
- [ ] Horas de hoje que já passaram são aceites; com a app aberta muito tempo, a hora por omissão fica para trás.
- [ ] O coração no mapa não atualiza quando se muda o favorito no detalhe (até à pesquisa seguinte).
- [ ] Detalhe mostra o custo anterior por um instante enquanto recalcula; erro num recálculo fica escondido.
- [ ] Zona com muitos espaços: só os 500 mais baratos são verificados (podem faltar livres).
- [ ] Link de partilha só funciona no Expo Go do PC até haver app publicada.
- [ ] Android: o círculo selecionado pode não mudar de cor (tracksViewChanges).
- [ ] Favoritos: mensagem de erro não desaparece depois de carregar bem.
- [ ] Falta teste para respostas antigas do mapa e para o mapa real (react-native-maps).

## Decisões futuras (não são bugs)
- [ ] Apagar a conta (RGPD) com reservas: anonimizar em vez de apagar em cascata (fase das reservas).
- [ ] Mapa com chave do Google Maps quando a app for publicada numa loja.
