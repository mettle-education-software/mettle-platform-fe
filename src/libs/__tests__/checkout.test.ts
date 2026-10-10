/** @jest-environment node */
// Links de compra e de renovação (fonte única, libs/checkout): o checkout HeroSpark de cada produto, com o UTM de origem
// e o motivo — compra (sem acesso) ou renovacao (Leitura).
import {
    EBOOK_RENEW_URL,
    EBOOK_SALES_URL,
    IMERSO_RENEW_URL,
    IMERSO_SALES_URL,
    MASTERCLASS_RENEW_URL,
    MASTERCLASS_SALES_URL,
} from '../checkout';
import { RENEWAL_URLS } from '../productAccess';

test('cada produto no próprio checkout, com origem e motivo no UTM', () => {
    const cases: [string, string, string][] = [
        [IMERSO_SALES_URL, 'programa-imerso-assinatura-anual-458079', 'compra'],
        [IMERSO_RENEW_URL, 'programa-imerso-assinatura-anual-458079', 'renovacao'],
        [MASTERCLASS_SALES_URL, 'masterclass-as-7-regras-para-a-fluencia-em-ingles-546744', 'compra'],
        [MASTERCLASS_RENEW_URL, 'masterclass-as-7-regras-para-a-fluencia-em-ingles-546744', 'renovacao'],
        [
            EBOOK_SALES_URL,
            'e-book-guia-completo-para-aprender-ingles-na-fase-adulta-com-estrategias-simples-e-comprovadas-546740',
            'compra',
        ],
        [
            EBOOK_RENEW_URL,
            'e-book-guia-completo-para-aprender-ingles-na-fase-adulta-com-estrategias-simples-e-comprovadas-546740',
            'renovacao',
        ],
    ];
    for (const [url, slug, reason] of cases) {
        const u = new URL(url);
        expect(u.origin + u.pathname).toBe(`https://pay.herospark.com/${slug}`);
        expect(Object.fromEntries(u.searchParams)).toEqual({
            utm_source: 'plataforma',
            utm_medium: 'organic',
            utm_campaign: reason,
        });
    }
    // o mapa antigo por produto aponta para o mesmo lugar
    expect(RENEWAL_URLS.METTLE_STUDENT).toBe(IMERSO_RENEW_URL);
});
