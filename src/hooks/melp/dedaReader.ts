import { auth } from 'config/firebase';
import { DedaReaderView, isDedaReaderAccount, readReaderView, saveReaderView } from 'libs/dedaReader';
import { useAppContext } from 'providers';
import { useCallback, useState } from 'react';

/**
 * Página nova do DEDA para esta conta? `allowed`: a conta está na lista (libs/dedaReader); `on`: e o dono não
 * escolheu "Classic view". A chave segue a conta REALMENTE logada (auth.currentUser): administrador navegando
 * "como o aluno" é ele mesmo — `user.uid` do contexto, nesse caso, é o do aluno (providers/AppProvider).
 */
export const useDedaReader = () => {
    const { user } = useAppContext();
    const allowed = isDedaReaderAccount(user ? auth.currentUser?.uid : null);
    const [view, setViewState] = useState<DedaReaderView>(() =>
        typeof window === 'undefined' ? 'new' : readReaderView(),
    );
    const setView = useCallback((next: DedaReaderView) => {
        saveReaderView(next);
        setViewState(next);
    }, []);
    return { allowed, on: allowed && view === 'new', setView };
};
