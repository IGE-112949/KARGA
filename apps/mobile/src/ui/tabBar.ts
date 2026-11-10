// Ecrãs que ocupam o ecrã inteiro (sem a barra de separadores), como o assistente "Novo espaço" no mockup.
// Assim também não dá para sair a meio por um separador e perder o que foi preenchido sem confirmação.
export const hideTabBarOn = (pathname: string) => /^\/spaces\/new\/?$/.test(pathname);
