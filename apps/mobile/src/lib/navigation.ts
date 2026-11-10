import { router, type Href } from 'expo-router';

// Troca de "zona" da app (entrar, sair, terminar o registo): limpa a pilha para o "voltar"
// do Android não regressar a ecrãs que já não fazem sentido (ex.: boas-vindas depois de entrar).
export function resetTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}
