// Checkout de cada produto (HeroSpark, pedido do André em 10-Out-2026): a fonte única de todo link de compra e de
// renovação da Plataforma. O UTM diz a origem (plataforma, orgânico) e o motivo: compra = sem acesso ("Desbloquear",
// "Conhecer"); renovacao = Leitura ("Renovar"). Sem imports: productAccess, masterclass e ebook leem daqui sem ciclo.
const CHECKOUT = {
    imerso: 'https://pay.herospark.com/programa-imerso-assinatura-anual-458079',
    masterclass: 'https://pay.herospark.com/masterclass-as-7-regras-para-a-fluencia-em-ingles-546744',
    ebook: 'https://pay.herospark.com/e-book-guia-completo-para-aprender-ingles-na-fase-adulta-com-estrategias-simples-e-comprovadas-546740',
} as const;

export type CheckoutProduct = keyof typeof CHECKOUT;

export const checkoutUrl = (product: CheckoutProduct, reason: 'compra' | 'renovacao') =>
    `${CHECKOUT[product]}?utm_source=plataforma&utm_medium=organic&utm_campaign=${reason}`;

export const IMERSO_SALES_URL = checkoutUrl('imerso', 'compra');
export const IMERSO_RENEW_URL = checkoutUrl('imerso', 'renovacao');
export const MASTERCLASS_SALES_URL = checkoutUrl('masterclass', 'compra');
export const MASTERCLASS_RENEW_URL = checkoutUrl('masterclass', 'renovacao');
export const EBOOK_SALES_URL = checkoutUrl('ebook', 'compra');
export const EBOOK_RENEW_URL = checkoutUrl('ebook', 'renovacao');
