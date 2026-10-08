// Masterclass "As 7 Regras" na Plataforma nova (8-Out-2026): slides dentro da Plataforma e a camada que apresenta o
// Programa Imerso na aba Texto. O texto do resumo vem do Contentful e NÃO muda aqui (escrita bloqueada até 1-Nov);
// tudo o que está abaixo é só do front. Testes: libs/__tests__/masterclass.test.ts.
import type { AccessState } from './productAccess';

export const MASTERCLASS_LESSON = 'as-7-regras-para-a-fluencia-em-ingles';

/** O link "aqui" do resumo (página externa, mantida para quem já a usa): na Plataforma, abre o leitor de slides. */
export const SLIDES_LINK = 'https://lp.mettle.com.br/masterclass/slides';
/** Lista de URLs assinadas (15 min) das imagens, com o acesso do aluno (Worker mettle-events). */
export const SLIDES_API = 'https://events.mettle.com.br/plataforma/masterclass/slides';

/** Botões "Matricular-se" desenhados nos slides 91 e 92 (mesmas áreas e destinos da página externa). */
export const SLIDE_HOTSPOTS: Record<
    number,
    { label: string; href: string; left: number; top: number; width: number; height: number }[]
> = {
    91: [
        {
            label: 'Matricular-se — Assinatura Anual',
            href: 'https://lp.mettle.com.br/imerso/cta-slides-anual',
            left: 39.9,
            top: 79.7,
            width: 20,
            height: 9.3,
        },
        {
            label: 'Matricular-se — Acesso de 3 Anos',
            href: 'https://lp.mettle.com.br/imerso/cta-slides-3anos',
            left: 70.9,
            top: 79.7,
            width: 20.3,
            height: 9.3,
        },
    ],
    92: [
        {
            label: 'Matricular-se — Assinatura Anual',
            href: 'https://lp.mettle.com.br/imerso/cta-slides-anual',
            left: 39.9,
            top: 79.7,
            width: 20,
            height: 9.3,
        },
        {
            label: 'Matricular-se — Acesso de 3 Anos',
            href: 'https://lp.mettle.com.br/imerso/cta-slides-3anos',
            left: 70.9,
            top: 79.7,
            width: 20.3,
            height: 9.3,
        },
    ],
};

export const isSlidesLink = (uri: unknown) =>
    typeof uri === 'string' && uri.replace(/[?#].*$/, '').replace(/\/+$/, '') === SLIDES_LINK;

/**
 * Textos do Imerso na aba Texto (André edita aqui). Só afirmações que estão no resumo da aula e nas notas do Imerso:
 * nada de garantia (só na oferta), números inventados ou depoimentos. Prazo honesto: de 1 a 3 anos.
 */
export const IMERSO_CTA = {
    /** Página de vendas: o paymentCheckout do curso (lp.mettle.com.br/imerso/plataforma → mettle.com.br/programa-imerso). */
    salesUrl: 'https://lp.mettle.com.br/imerso/plataforma',

    /** (a) no meio do texto, logo depois da Regra 6 ("insira-se num sistema"). */
    inline: {
        eyebrow: 'Regra 6 na prática',
        title: 'O Imerso é esse sistema.',
        text: 'Se a disciplina não vem do comprometimento, ela vem de um sistema. No Imerso, a LAMP monta o seu cronograma e as suas metas, e o DEDA entrega o conteúdo de cada semana pronto para os cinco passos. Você não monta nada sozinho: você treina.',
        link: 'Conheça o Imerso',
    },

    /** (b) no fim do texto. */
    closing: {
        eyebrow: 'Programa Imerso',
        title: 'As sete regras, implementadas à risca.',
        blocks: [
            { name: 'HPEC', text: 'O mapa do zero à fluência: aulas, técnicas de estudo e treino da fala.' },
            { name: 'DEDA', text: 'O conteúdo do mundo real, curado e organizado nos cinco passos, semana a semana.' },
            {
                name: 'LAMP',
                text: 'A gestão do aprendizado: metas, cronograma e acompanhamento. O seu sistema de disciplina.',
            },
        ],
        forWho: 'Para o adulto que decidiu estudar em inglês todos os dias, de 35 a 45 minutos. A fluência leva de 1 a 3 anos, dependendo do seu nível de partida.',
        primary: 'Conheça o Imerso',
        secondary: 'Falar com a equipe',
    },

    /** (c) barra fina na aba Texto, a partir de 60% da leitura. */
    bar: {
        text: 'Pronto para o sistema completo?',
        link: 'Conheça o Imerso',
        dismiss: 'Fechar',
    },
} as const;

/** Onde entra o cartão (a): antes do título da Regra 7 (a Regra 6 termina em "insira-se num sistema"). -1 = não entra. */
export function inlineCtaIndex(content: { nodeType: string; content?: unknown[] }[]): number {
    const text = (n: unknown): string => {
        const node = n as { value?: string; content?: unknown[] };
        return node.value ?? (node.content ?? []).map(text).join('');
    };
    return content.findIndex((n) => /^heading-/.test(n.nodeType) && /^\s*Regra 7\b/.test(text(n)));
}

/** Quem já tem o Imerso (ativo, carência ou expirado) não vê nada disto. `preview` = o dono conferindo (?imerso-cta). */
export const showImersoCta = (imerso: AccessState, preview = false) => preview || imerso === 'none';

/** Barra fina: depois de 60% lidos, até o bloco final aparecer na tela. */
export const showCtaBar = (progress: number, closingVisible: boolean, dismissed: boolean) =>
    !dismissed && !closingVisible && progress >= 0.6;

/** "Falar com a equipe": o Suporte já abre com o link desta aula na mensagem (libs/chat.contextPrefill). */
export const supportHref = (lessonPath: string) => `/suporte?ctx=${encodeURIComponent(lessonPath)}`;
