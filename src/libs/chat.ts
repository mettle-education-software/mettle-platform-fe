// Mettle Chat (7-Out-2026): a página "Suporte" (/suporte) no lugar do widget do Chatwoot — por ora só nas contas da
// plataforma nova (libs/newDesign). Tudo passa pelo Worker mettle-events (/plataforma/chat), que verifica o ID token do
// Firebase e só fala com a conversa do próprio aluno; o navegador nunca vê o contato nem o segredo do Chatwoot.
export const CHAT_URL = 'https://events.mettle.com.br/plataforma/chat';
export const CHAT_PATH = '/suporte';

export type ChatFile = {
    kind: 'image' | 'audio' | 'file';
    url: string;
    thumb: string | null;
    size: number | null;
    ext: string | null;
};
export type ChatMessage = {
    id: number;
    /** segundos (epoch) */
    at: number;
    mine: boolean;
    text: string;
    from: { name: string; avatar: string | null } | null;
    files: ChatFile[];
    /** só no navegador: mensagem ainda a caminho (id negativo) ou que falhou */
    pending?: 'sending' | 'failed';
};
export type ChatPage = {
    messages: ChatMessage[];
    more: boolean;
    teamSeenAt: number;
    unread: number;
    ws: { url: string; token: string };
};

/** Junta mensagens novas às que já estão na tela: por id, em ordem de envio; as pendentes ficam no fim. */
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
    const byId = new Map<number, ChatMessage>();
    for (const m of current) byId.set(m.id, m);
    for (const m of incoming) byId.set(m.id, m);
    const all = [...byId.values()];
    const sent = all.filter((m) => !m.pending).sort((a, b) => a.at - b.at || a.id - b.id);
    return [...sent, ...all.filter((m) => m.pending)];
}

const dayKey = (at: number) => new Date(at * 1000).toLocaleDateString('en-CA');

/** Rótulo do dia: Hoje, Ontem, ou a data (com o ano só se não for o atual). */
export function dayLabel(at: number, now = Date.now()): string {
    const d = new Date(at * 1000);
    const today = new Date(now);
    if (dayKey(at) === dayKey(now / 1000)) return 'Hoje';
    if (dayKey(at) === dayKey(now / 1000 - 86400)) return 'Ontem';
    return d.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
    });
}

export const timeLabel = (at: number) =>
    new Date(at * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export type ChatRow =
    | { type: 'day'; key: string; label: string }
    | { type: 'msg'; key: string; m: ChatMessage; first: boolean; last: boolean };

/**
 * Linhas da conversa: separador por dia e grupos por remetente (o nome e o avatar da equipe só na primeira mensagem de
 * um grupo; um grupo quebra com outro remetente, outro dia ou 5 min de silêncio).
 */
export function chatRows(messages: ChatMessage[], now = Date.now()): ChatRow[] {
    const rows: ChatRow[] = [];
    const who = (m: ChatMessage) => (m.mine ? '@me' : (m.from?.name ?? ''));
    messages.forEach((m, i) => {
        const prev = messages[i - 1],
            next = messages[i + 1];
        const newDay = !prev || dayKey(prev.at) !== dayKey(m.at);
        if (newDay) rows.push({ type: 'day', key: 'd' + dayKey(m.at), label: dayLabel(m.at, now) });
        const joins = (a?: ChatMessage, b?: ChatMessage) =>
            !!a && !!b && who(a) === who(b) && dayKey(a.at) === dayKey(b.at) && Math.abs(b.at - a.at) < 300;
        rows.push({ type: 'msg', key: 'm' + m.id, m, first: !joins(prev, m), last: !joins(m, next) });
    });
    return rows;
}

/** Gancho "Perguntar sobre isto": /suporte?ctx=<url> preenche a mensagem com o link (só links da própria Plataforma). */
export function contextPrefill(ctx: string | null | undefined, origin: string): string {
    if (!ctx) return '';
    try {
        const u = new URL(ctx, origin);
        return u.origin === origin ? `${u.href}\n` : '';
    } catch {
        return '';
    }
}

/** Texto com links clicáveis (sem HTML do servidor: só texto e <a>). */
export function linkParts(text: string): { text: string; href?: string }[] {
    const out: { text: string; href?: string }[] = [];
    const re = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]]/g;
    let last = 0;
    for (const m of text.matchAll(re)) {
        if (m.index! > last) out.push({ text: text.slice(last, m.index) });
        out.push({ text: m[0], href: m[0] });
        last = m.index! + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    return out;
}

export const formatSize = (n: number | null) =>
    n == null ? '' : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
