/** @jest-environment node */
// Leitura navega e vê (pedido do André, 10-Out-2026): o catálogo de DEDAs aparece inteiro, trancado, e cada card
// leva à renovação — nunca uma página em branco nem card sem saída.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NewDedaCard } from '../../components/_new/NewDedaCard';
import { NewDedasGrid } from '../../components/_new/NewDedasGrid';

const RENEW = 'https://pay.example/renovar?utm_campaign=renovacao';
const mockGrid = {
    unlockedDEDAs: ['DEDA1'],
    currentDeda: 'DEDA1',
    showSkeleton: false,
    showNext: false,
    lastDedas: [],
    nextDedas: [],
    allDedas: [
        { dedaId: 'DEDA1', dedaSlug: 'london', dedaTitle: 'London', dedaFeaturedImage: { url: '//img/1.jpg' } },
        { dedaId: 'DEDA2', dedaSlug: 'change', dedaTitle: 'Change', dedaFeaturedImage: { url: '//img/2.jpg' } },
    ],
    weekOf: () => undefined,
    nextWeekOf: () => undefined,
};
jest.mock('components/_melp/_deda/DedasGrid/DedasGrid', () => ({ useDedasGrid: () => mockGrid }), { virtual: true });
jest.mock('next/navigation', () => ({ useRouter: () => ({ prefetch: jest.fn(), push: jest.fn() }) }));
jest.mock('libs/cleanUrls', () => ({ dedaPath: (slug: string) => `/imerso/deda/${slug}` }), { virtual: true });
jest.mock('libs/dedaHeader', () => ({ contentfulImage: (url?: string) => url }), { virtual: true });
jest.mock('themes/newDesign', () => ({ ICON: {} }), { virtual: true });

test('card em Leitura: link para a renovação, com cadeado e o nome do DEDA', () => {
    const html = renderToStaticMarkup(createElement(NewDedaCard, { title: 'Change', week: 'Week 3', renew: RENEW }));
    expect(html).toContain(`href="${RENEW.replace(/&/g, '&amp;')}"`);
    expect(html).toContain('class="dc locked"');
    expect(html).toContain('aria-label="Renew to open Change, Week 3"');
    expect(html).toContain('lock');
    expect(html).not.toContain('<button');
});

test('card fora da Leitura: o de sempre (trancado sem clique; liberado é botão)', () => {
    const locked = renderToStaticMarkup(createElement(NewDedaCard, { title: 'Change', state: 'locked' }));
    expect(locked).toContain('disabled=""');
    expect(locked).not.toContain('href=');
});

test('catálogo em Leitura: todos os DEDAs à vista, todos trancados, todos levam à renovação', () => {
    const html = renderToStaticMarkup(
        createElement(NewDedasGrid, { type: 'allDedas', onSelectedDeda: jest.fn(), renew: RENEW }),
    );
    expect(html.match(/class="dc locked"/g)).toHaveLength(2);
    expect(html.match(/<a /g)).toHaveLength(2);
    expect(html).not.toContain('Current');
});
