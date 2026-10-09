export const padNumber = (num: number) => {
    return num < 10 ? '0' + num : num?.toString();
};

// O "dia" da Plataforma é o de Brasília (o mesmo do servidor), nunca o relógio do aparelho: aluno no exterior ou
// navegador em UTC depois das 21h não pode ver nem gravar no dia seguinte.
export const SAO_PAULO_TZ = 'America/Sao_Paulo';
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Dia da semana em Brasília: 1 = segunda … 7 = domingo. */
export const saoPauloWeekday = (date: Date = new Date()) =>
    WEEKDAYS.indexOf(new Intl.DateTimeFormat('en-US', { timeZone: SAO_PAULO_TZ, weekday: 'short' }).format(date)) + 1;

/** Meio-dia de Brasília do dia de hoje lá, `plusDays` dias depois: a data certa em qualquer fuso próximo. */
const saoPauloNoon = (date: Date, plusDays = 0) => {
    const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: SAO_PAULO_TZ }).format(date).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + plusDays, 15)); // 15h UTC = 12h em Brasília (sem horário de verão desde 2019)
};

export const getWeekDay = () => String(saoPauloWeekday()).padStart(2, '0');

export const getDayToday = () => `day${saoPauloWeekday()}`;

export function extractYouTubeID(url: string) {
    const queryStart = url.indexOf('?v=') + 3; // Find the start index of "?v=" and adjust for its length
    const ampersandPosition = url.indexOf('&', queryStart); // Find the end of the video ID (it might be followed by other parameters)

    if (ampersandPosition === -1) {
        // If there is no "&", use the substring from "?v=" to the end of the URL
        return url.substring(queryStart);
    } else {
        // Otherwise, use the substring from "?v=" to the "&" (start of another parameter)
        return url.substring(queryStart, ampersandPosition);
    }
}

export const getClosestTimeListValue: (timeValue: number) => number = (timeValue) => {
    if (timeValue < 25) return 0;

    if (timeValue >= 25 && timeValue <= 30) return 30;

    const decimal = Math.floor(timeValue / 10);
    const unit = timeValue % 10;

    if (unit < 3) return decimal * 10;
    if (unit >= 3 && unit < 7) return decimal * 10 + 5;

    return 0;
};

/** Segunda em que o DEDA começa (regra do servidor, toScheduledSaoPauloDedaStart): hoje se for segunda; senão a próxima. */
export const nextMondayDate = (now: Date = new Date()) => {
    const day = saoPauloWeekday(now);
    return saoPauloNoon(now, day === 1 ? 0 : 8 - day);
};

/** "Monday, Oct 12": data de Brasília, em inglês (avisos do IMERSO). */
export const formatImersoDate = (date: Date) =>
    date.toLocaleDateString('en-US', { timeZone: SAO_PAULO_TZ, weekday: 'long', month: 'short', day: 'numeric' });

export const getUnlockedDate = (currentDay: number, drippingDay: number, now: Date = new Date()) =>
    `Available on: ${saoPauloNoon(now, drippingDay - currentDay).toLocaleDateString('en-US', { timeZone: SAO_PAULO_TZ })}`;
