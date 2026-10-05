'use client';

import { auth } from 'config/firebase';
import { isNewDesignAccount } from 'libs/newDesign';
import { useAppContext } from 'providers';

/**
 * Plataforma nova para esta conta? Segue a conta REALMENTE logada (auth.currentUser): administrador navegando
 * "como o aluno" é ele mesmo — `user.uid` do contexto, nesse caso, é o do aluno (providers/AppProvider).
 * Mesma regra de hooks/melp/dedaReader (useDedaReader.allowed). O contexto entra só para reavaliar quando a
 * sessão carrega; a decisão nunca usa o uid do contexto.
 */
export const useNewDesign = () => {
    useAppContext();
    return isNewDesignAccount(auth.currentUser?.uid);
};
