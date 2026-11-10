import { createContext, useContext } from 'react';

// Dentro dos separadores a barra de baixo já trata da margem de segurança do telemóvel;
// os ecrãs não a devem somar outra vez (senão fica um espaço vazio por cima da barra).
const TabBarVisible = createContext(false);
export const TabBarVisibleProvider = TabBarVisible.Provider;
export const useTabBarVisible = () => useContext(TabBarVisible);
