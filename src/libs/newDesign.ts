// Plataforma nova ("tuneup", 5-Out-2026): a mesma chave por conta da página nova do DEDA, generalizada para a casca
// (AppLayout) e para as páginas que já têm versão nova. Ponto único: quem vê a plataforma nova é decidido só aqui.
// Chave desligada = nenhum pixel muda para os alunos (componentes novos vêm por next/dynamic; os atuais ficam intactos).
import { DEDA_READER_FORCED_OFF, DEDA_READER_UIDS, isDedaReaderAccount } from './dedaReader';

/** Contas com a plataforma nova: a mesma lista da página do DEDA (só a do dono, em produção, como ambiente de teste). */
export const NEW_DESIGN_UIDS = DEDA_READER_UIDS;

/** DEDA_READER=off desliga tudo (página do DEDA e plataforma nova) para todo mundo. */
export const NEW_DESIGN_FORCED_OFF = DEDA_READER_FORCED_OFF;

/** `uid` é o da conta REALMENTE logada (auth.currentUser), nunca o do aluno que um administrador está vendo. */
export const isNewDesignAccount = (uid?: string | null, forcedOff = NEW_DESIGN_FORCED_OFF) =>
    isDedaReaderAccount(uid, forcedOff);

// ---------- menu lateral: item ativo e estado "recolhido" ----------

/**
 * Chaves do menu (useAppMenu) ativas para um caminho. A regra atual (`pathname.split('/')`) nunca acende "Início"
 * nem os itens do IMERSO; aqui cada item acende na sua rota e o pai (IMERSO) acende junto com o filho.
 */
export const activeMenuKeys = (pathname: string): string[] => {
    if (pathname === '/' || pathname === '') return ['home'];
    if (pathname.startsWith('/settings')) return ['settings'];
    if (pathname.startsWith('/imerso/hpec')) return ['imerso', 'meplHpec'];
    if (pathname.startsWith('/imerso/deda')) return ['imerso', 'melpDeda'];
    if (pathname.startsWith('/imerso/lamp')) return ['imerso', 'melpLamp'];
    if (pathname.startsWith('/imerso')) return ['imerso'];
    return [];
};

/** Menu recolhido a um trilho de ícones: preferência por aparelho (mesma chave do menu atual, `menuCollapsed`). */
export const MENU_COLLAPSED_KEY = 'menuCollapsed';

export const readMenuCollapsed = (): boolean => {
    try {
        return window.localStorage.getItem(MENU_COLLAPSED_KEY) === 'true';
    } catch {
        return false;
    }
};

export const saveMenuCollapsed = (collapsed: boolean) => {
    try {
        window.localStorage.setItem(MENU_COLLAPSED_KEY, String(collapsed));
    } catch {
        // modo privado / armazenamento bloqueado: vale só nesta visita
    }
};

// ---------- textos curtos ----------

/** Primeiro nome, como o cumprimento atual ("Olá, {nome}"). */
export const firstName = (name?: string | null) => (name ?? '').trim().split(/\s+/)[0] ?? '';

/** Aba inicial de /settings pelo `?tab=` (o item "Suporte" cai em `/settings?tab=help` sem o chat). */
export const settingsTabFromQuery = (tab: string | null | undefined, keys: readonly string[]) =>
    tab && keys.includes(tab) ? tab : keys[0];
