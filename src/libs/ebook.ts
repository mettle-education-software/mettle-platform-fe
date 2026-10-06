// E-book como produto da Plataforma (6-Out-2026): dados do produto e regras puras (testadas em libs/__tests__/ebook.test.ts).
// O acesso é o mesmo dos cursos (useProductAccess → /accounts/v2/me/access, roles na transição). O arquivo nunca tem
// endereço fixo: o Worker mettle-events confere o acesso do aluno e devolve um link de 10 min para ler/baixar o PDF.
// Sem entrada no Contentful por ora (cota do mês estourada até 1-Nov): os dados ficam aqui.
import type { AccessState } from './productAccess';

/** Produto em product_access / roles (mesmo nome que o Worker usa). */
export const EBOOK_PRODUCT = 'EBOOK_GUIA_COMPLETO';
export const EBOOK_PATH = '/guia';
export const EBOOK_LINK_URL = 'https://events.mettle.com.br/plataforma/guia/link';

export const EBOOK = {
    title: 'Guia Completo para Aprender Inglês na Fase Adulta',
    subtitle: 'com Estratégias Simples e Comprovadas',
    author: 'André Floriano',
    description:
        'As 21 mentiras que travam o adulto, o que a neurociência diz sobre aprender, as 12 regras e o método para organizar o seu estudo.',
    pages: 123,
} as const;

export interface EbookLink {
    read: string;
    download: string;
    expiresAt: string;
}

/** Pode ler e baixar: ativo ou em carência (expirado e estornado não). */
export const ebookOpen = (state: AccessState) => state === 'active' || state === 'grace';

/** O link curto ainda serve para um clique (margem de 30 s antes de vencer). */
export const linkFresh = (link: EbookLink | null | undefined, now = Date.now()) =>
    !!link && Date.parse(link.expiresAt) - now > 30_000;
