/**
 * Uma fonte da Plataforma em duas partes, como o Google Fonts servia: o latin (português inteiro) e o latin-ext (ł, ő, ș:
 * nomes e endereços), cada uma no seu unicode-range, e depois a reserva com as métricas ajustadas (styles/globals.css).
 * O className liga as duas variáveis e a classe da pilha; o fontFamily é a mesma pilha, para o CSS-in-JS e os temas.
 */
type Part = { variable: string; style: { fontFamily: string } };
export const fontStack = (latin: Part, ext: Part, stackClass: string, fallback: string) => ({
    className: `${latin.variable} ${ext.variable} ${stackClass}`,
    style: { fontFamily: `${latin.style.fontFamily}, ${ext.style.fontFamily}, '${fallback}'` },
});
