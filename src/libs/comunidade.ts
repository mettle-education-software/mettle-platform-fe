// Comunidade Imerso (7-Out-2026): o grupo dos alunos na Plataforma (/comunidade), estilo grupo do WhatsApp, sobre o
// Worker mettle-comunidade (Durable Object). Por ora só quem está na lista do Worker (fase 1: o dono); o menu só aparece
// para quem o Worker reconhece como membro.
import type { ChatMessage } from './chat';

export const COMUNIDADE_URL = 'https://comunidade.mettle.com.br';
export const COMUNIDADE_PATH = '/comunidade';

export type Kind = 'text' | 'image' | 'audio' | 'file' | 'sticker';
export type CMessage = {
    id: number;
    at: number;
    uid: string;
    name: string;
    text: string;
    kind: Kind;
    media: { url: string; size: number | null; ext: string | null } | null;
    reply: { id: number; uid: string; name: string; text: string; kind: Kind; deleted: boolean } | null;
    mentions: string[];
    reactions: Record<string, string[]>;
    deleted: 'self' | 'admin' | null;
    /** só no navegador */
    pending?: 'sending' | 'failed';
};
export type CMember = { uid: string; name: string; admin: boolean; muted: boolean; removed?: boolean };
export type CState = {
    me: { uid: string; name: string; admin: boolean; muted: boolean; pushMute: boolean; rules: boolean };
    messages: CMessage[];
    more: boolean;
    pins: CMessage[];
    members: number;
    lastRead: number;
    unread: number;
    ws: string;
    vapid: string | null;
};

/** No formato do Mettle Chat (para os mesmos balões, grupos e separadores de dia). */
export function toChat(m: CMessage, me: string): ChatMessage {
    const kind = m.kind === 'sticker' ? 'image' : m.kind;
    return {
        id: m.id,
        at: m.at,
        mine: m.uid === me,
        text: m.text,
        from: { name: m.name, avatar: null },
        files:
            m.media && kind !== 'text'
                ? [{ kind, url: m.media.url, thumb: null, size: m.media.size, ext: m.media.ext }]
                : [],
        sticker: m.kind === 'sticker',
        reply: m.reply
            ? {
                  id: m.reply.id,
                  mine: m.reply.uid === me,
                  name: m.reply.name,
                  text: m.reply.deleted ? 'Mensagem apagada' : m.reply.text,
                  kind: m.reply.kind,
              }
            : null,
        pending: m.pending,
    };
}

/** Junta por id, em ordem de envio; as pendentes ficam no fim. */
export function mergeC(cur: CMessage[], incoming: CMessage[]): CMessage[] {
    const byId = new Map(cur.map((m) => [m.id, m]));
    for (const m of incoming) byId.set(m.id, m);
    const all = [...byId.values()];
    return [...all.filter((m) => !m.pending).sort((a, b) => a.id - b.id), ...all.filter((m) => m.pending)];
}

/** Trechos do texto com as menções (@Nome de quem foi mencionado) separadas, para destacar. */
export function mentionParts(text: string, names: string[]): { text: string; mention?: boolean }[] {
    const list = [...new Set(names)].filter(Boolean).sort((a, b) => b.length - a.length);
    if (!list.length) return [{ text }];
    const esc = list.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const out: { text: string; mention?: boolean }[] = [];
    let last = 0;
    for (const m of text.matchAll(new RegExp(`@(?:${esc.join('|')})`, 'g'))) {
        if (m.index! > last) out.push({ text: text.slice(last, m.index) });
        out.push({ text: m[0], mention: true });
        last = m.index! + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    return out;
}

/** "@ana" sendo digitado logo antes do cursor: o trecho a completar (ou null). */
export function mentionQuery(text: string, caret: number): { start: number; q: string } | null {
    const m = /(^|\s)@([^\s@]{0,30})$/.exec(text.slice(0, caret));
    return m ? { start: caret - m[2].length - 1, q: m[2] } : null;
}

/** Regras do grupo (aceite único; mudou o texto → subir RULES_V no Worker). */
export const RULES = [
    'Respeito sempre. Nada de ofensa, discriminação ou assédio.',
    'Fale de inglês e do Imerso. Outros assuntos, em outro lugar.',
    'Sem spam, propaganda ou divulgação própria.',
    'O conteúdo do curso fica aqui: não compartilhe fora.',
    'Privacidade: não publique dados pessoais de ninguém.',
    'A moderação pode apagar mensagens e remover participantes.',
];
