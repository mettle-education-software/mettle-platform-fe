import { inlineCtaIndex, isSlidesLink, showCtaBar, showImersoCta, supportHref } from '../masterclass';

const h = (t: string) => ({ nodeType: 'heading-3', content: [{ nodeType: 'text', value: t }] });
const p = (t: string) => ({ nodeType: 'paragraph', content: [{ nodeType: 'text', value: t }] });

describe('masterclass', () => {
    it('o link dos slides é reconhecido com ou sem barra/UTM; outros não', () => {
        expect(isSlidesLink('https://lp.mettle.com.br/masterclass/slides')).toBe(true);
        expect(isSlidesLink('https://lp.mettle.com.br/masterclass/slides/?utm_source=x')).toBe(true);
        expect(isSlidesLink('https://lp.mettle.com.br/masterclass/slides-extra')).toBe(false);
        expect(isSlidesLink('https://lp.mettle.com.br/imerso/resumo-anual')).toBe(false);
        expect(isSlidesLink(undefined)).toBe(false);
    });

    it('cartão entra antes do título da Regra 7; sem ele, não entra', () => {
        expect(
            inlineCtaIndex([
                h('Regra 6 — Cultivar disciplina'),
                p('Regra 7 no meio do texto'),
                h('Regra 7 — A regra de ouro'),
            ]),
        ).toBe(2);
        expect(inlineCtaIndex([h('Regra 6'), p('x')])).toBe(-1);
    });

    it('quem tem o Imerso (ativo, carência, expirado) não vê; o dono vê com ?imerso-cta', () => {
        expect(showImersoCta('none')).toBe(true);
        expect(showImersoCta('active')).toBe(false);
        expect(showImersoCta('grace')).toBe(false);
        expect(showImersoCta('expired')).toBe(false);
        expect(showImersoCta('active', true)).toBe(true);
    });

    it('barra: a partir de 60%, some com o bloco final na tela ou fechada', () => {
        expect(showCtaBar(0.59, false, false)).toBe(false);
        expect(showCtaBar(0.6, false, false)).toBe(true);
        expect(showCtaBar(0.8, true, false)).toBe(false);
        expect(showCtaBar(0.8, false, true)).toBe(false);
    });

    it('suporte com o link da aula', () => {
        expect(supportHref('/course/masterclass-as-7-regras/as-7-regras-para-a-fluencia-em-ingles')).toBe(
            '/suporte?ctx=%2Fcourse%2Fmasterclass-as-7-regras%2Fas-7-regras-para-a-fluencia-em-ingles',
        );
    });
});
