// Impersonação = modo visualização (decisão de 10-Out-2026, para proteger os dados do aluno): o administrador vê
// exatamente o que o aluno vê, e nada grava. O ApiClient e as chamadas aos Workers consultam este interruptor antes
// de gravar; o servidor também recusa (403 IMPERSONATION_READ_ONLY). Ligado pelo AppProvider com a sessão.
export const VIEW_ONLY_EVENT = 'mettle:view-only';
export const VIEW_ONLY_CODE = 'IMPERSONATION_READ_ONLY';
const MESSAGE = 'Modo visualização: nada é gravado.';

let on = false;
export const setViewOnly = (value: boolean) => {
    on = value;
};
export const isViewOnly = () => on;

/** Pedido que grava, com o modo ligado: GET/HEAD/OPTIONS só leem; sair da impersonação sempre pode. */
export const blocksWrite = (method: string | undefined, url: string | undefined) =>
    on &&
    !['get', 'head', 'options'].includes((method ?? 'get').toLowerCase()) &&
    !/\/impersonate\/remove\b/.test(url ?? '');

/** Avisa a tela (barra "Visualizando como") e devolve o erro no formato das recusas do servidor ({ code, message }). */
export const viewOnlyRefusal = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(VIEW_ONLY_EVENT));
    return Object.assign(new Error(MESSAGE), {
        code: VIEW_ONLY_CODE,
        response: { status: 403, data: { code: VIEW_ONLY_CODE, message: MESSAGE } },
    });
};

/** Para as chamadas aos Workers (fetch): recusa a gravação antes de sair do aparelho. */
export const guardWrite = (method: string | undefined, url: string | undefined) => {
    if (blocksWrite(method, url)) throw viewOnlyRefusal();
};
