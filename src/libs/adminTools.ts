// Ferramentas internas do dono (página /admin). Uma linha por ferramenta: a página e o menu leem esta lista.
// `panel` abre o painel de administração da casca (acessar como aluno, segmentos, Mercy Mode).

export type AdminTool = { key: string; title: string; line: string } & ({ href: string } | { panel: true });

export const ADMIN_TOOLS: readonly AdminTool[] = [
    { key: 'alunos', title: 'Painel de alunos', line: 'Acessar como aluno, segmentos e Mercy Mode', panel: true },
    {
        key: 'leitura',
        title: 'Análise de leitura',
        line: 'A leitura do DEDA, palavra a palavra',
        href: '/admin/leitura',
    },
    { key: 'leaderboard', title: 'Leaderboard', line: 'O ranking dos alunos', href: '/admin/leaderboard' },
];

/** Abre o painel de administração da casca (o mesmo do botão do menu). */
export const ADMIN_PANEL_EVENT = 'mettle-open-admin-panel';
export const openAdminPanel = () => {
    if (typeof window !== 'undefined')
        window.dispatchEvent(new CustomEvent(ADMIN_PANEL_EVENT, { detail: { done: false } }));
};
