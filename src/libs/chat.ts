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
/** Trecho citado (resposta a uma mensagem). */
export type ChatQuote = {
    id: number;
    mine: boolean;
    name: string;
    text: string;
    kind: 'text' | 'image' | 'audio' | 'file' | 'sticker';
};
export type ChatMessage = {
    id: number;
    /** segundos (epoch) */
    at: number;
    mine: boolean;
    text: string;
    from: { name: string; avatar: string | null } | null;
    files: ChatFile[];
    /** figurinha (content_type sticker no Chatwoot): sem balão */
    sticker?: boolean;
    reply?: ChatQuote | null;
    /** reação do próprio aluno (uma por mensagem, como no WhatsApp) */
    reaction?: string | null;
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

/** As 6 reações rápidas (iguais às do Worker). */
export const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/** Mensagem só de 1 a 3 emojis: aparece grande e sem balão, como no WhatsApp. */
export function bigEmoji(text: string): boolean {
    const t = text.trim();
    if (!t || t.length > 40) return false;
    const parts = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(t)]
        .map((x) => x.segment)
        .filter((x) => x.trim());
    return (
        parts.length > 0 &&
        parts.length <= 3 &&
        parts.every((g) => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(g))
    );
}

/** Matiz estável por nome (nome do atendente em cor, como nos grupos do WhatsApp); a luminosidade vem do tema (CSS). */
export function nameHue(name: string): number {
    const hues = [24, 168, 286, 44, 208, 338, 120];
    let h = 0;
    for (const c of name) h = (h * 31 + c.codePointAt(0)!) >>> 0;
    return hues[h % hues.length];
}

/** Forma de onda determinística por mensagem (sem baixar e decodificar o áudio): `n` barras entre 0,2 e 1. */
export function waveform(seed: number, n = 36): number[] {
    let x = (Math.abs(seed) * 2654435761) >>> 0 || 1;
    const rnd = () => (x = (x * 1103515245 + 12345) >>> 0) / 2 ** 32;
    const raw = Array.from({ length: n }, () => rnd());
    return raw.map((v, i) => {
        const avg = (v + (raw[i - 1] ?? v) + (raw[i + 1] ?? v)) / 3;
        return Math.round((0.2 + 0.8 * avg) * 100) / 100;
    });
}

/** Onde entra a faixa "N mensagens não lidas": antes da N-ésima mensagem da equipe, contando do fim. */
export function unreadStart(messages: ChatMessage[], unread: number): number | null {
    if (unread <= 0) return null;
    let left = unread;
    for (let i = messages.length - 1; i >= 0; i--) {
        if (!messages[i].mine && --left === 0) return messages[i].id;
    }
    return null;
}

/** Rótulo curto de uma citação ou anexo. */
export function quoteText(q: Pick<ChatQuote, 'text' | 'kind'>): string {
    if (q.text) return q.text;
    return { image: '📷 Foto', audio: '🎤 Áudio', file: '📄 Documento', sticker: 'Figurinha', text: '' }[q.kind];
}

/** Nome do arquivo a partir da URL do Chatwoot (o último trecho do caminho). */
export function fileName(url: string, ext: string | null): string {
    try {
        const last = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
        if (last && last.includes('.')) return last;
    } catch {
        // URL local (blob:)
    }
    return ext ? `arquivo.${ext}` : 'arquivo';
}

export const durationLabel = (s: number) =>
    !isFinite(s) || s <= 0 ? '0:00' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
