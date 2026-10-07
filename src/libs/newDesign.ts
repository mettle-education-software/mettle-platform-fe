// Plataforma nova ("tuneup", 5-Out-2026): a mesma chave por conta da página nova do DEDA, generalizada para a casca
// (AppLayout) e para as páginas que já têm versão nova. Ponto único: quem vê a plataforma nova é decidido só aqui.
// Chave desligada = nenhum pixel muda para os alunos (componentes novos vêm por next/dynamic; os atuais ficam intactos).
import { DEDA_READER_FORCED_OFF, DEDA_READER_UIDS, isDedaReaderAccount } from './dedaReader';

/** Contas com a plataforma nova: a mesma lista da página do DEDA (só a do dono, em produção, como ambiente de teste). */
export const NEW_DESIGN_UIDS = DEDA_READER_UIDS;

/** DEDA_READER=off desliga tudo (página do DEDA e plataforma nova) para todo mundo. */
export const NEW_DESIGN_FORCED_OFF = DEDA_READER_FORCED_OFF;

/** `uid` é o da conta REALMENTE logada (auth.currentUser), nunca o do aluno que um administrador está vendo. */
export const isNewDesignAccount = (uid?: string | null, forcedOff = NEW_DESIGN_FORCED_OFF) =>
    isDedaReaderAccount(uid, forcedOff);

// ---------- casca persistente ----------

/**
 * Rotas que vivem dentro da casca (as que usam AppLayout). Na plataforma nova a casca fica montada no layout raiz e
 * só o conteúdo troca entre essas rotas: menu, barra e fundo nunca piscam.
 */
export const isShellRoute = (pathname: string | null | undefined) =>
    !!pathname && (pathname === '/' || /^\/(imerso|course|settings|guia)(\/|$)/.test(pathname));

/**
 * O aplicativo já hidratou? Antes disso, nada pode depender da sessão (o servidor não a conhece): a casca persistente
 * e o atalho de withAuthentication só valem a partir do primeiro efeito no navegador (sem erro de hidratação).
 */
let hydrated = false;
export const markHydrated = () => {
    hydrated = true;
};
export const isHydrated = () => hydrated;

/** Aula a partir do endereço (/imerso/hpec/<aula>, /course/<curso>/<aula>): o último trecho do caminho. */
export const lessonIdFromPath = (pathname: string | null | undefined, fallback: string) =>
    pathname?.split('?')[0].split('/').filter(Boolean).pop() || fallback;

// ---------- menu lateral: item ativo e estado "recolhido" ----------

/**
 * Chaves do menu (useAppMenu) ativas para um caminho. A regra atual (`pathname.split('/')`) nunca acende "Início"
 * nem os itens do IMERSO; aqui cada item acende na sua rota e o pai (IMERSO) acende junto com o filho.
 */
export const activeMenuKeys = (pathname: string): string[] => {
    if (pathname === '/' || pathname === '') return ['home'];
    if (pathname.startsWith('/settings')) return ['settings'];
    if (pathname.startsWith('/imerso/hpec')) return ['imerso', 'meplHpec'];
    if (pathname.startsWith('/imerso/deda')) return ['imerso', 'melpDeda'];
    if (pathname.startsWith('/imerso/lamp')) return ['imerso', 'melpLamp'];
    if (pathname.startsWith('/imerso')) return ['imerso'];
    return [];
};

/** Menu recolhido a um trilho de ícones: preferência por aparelho (mesma chave do menu atual, `menuCollapsed`). */
export const MENU_COLLAPSED_KEY = 'menuCollapsed';

export const readMenuCollapsed = (): boolean => {
    try {
        return window.localStorage.getItem(MENU_COLLAPSED_KEY) === 'true';
    } catch {
        return false;
    }
};

export const saveMenuCollapsed = (collapsed: boolean) => {
    try {
        window.localStorage.setItem(MENU_COLLAPSED_KEY, String(collapsed));
    } catch {
        // modo privado / armazenamento bloqueado: vale só nesta visita
    }
};

// ---------- textos curtos ----------

/** Primeiro nome, como o cumprimento atual ("Olá, {nome}"). */
export const firstName = (name?: string | null) => (name ?? '').trim().split(/\s+/)[0] ?? '';

/** Páginas com cabeçalho próprio (leitor do DEDA) abrem o MESMO menu da casca (gaveta no celular): um menu só. */
export const MENU_OPEN_EVENT = 'mettle-open-menu';
export const openShellMenu = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(MENU_OPEN_EVENT));
};

/** Aba inicial de /settings pelo `?tab=` (o item "Suporte" cai em `/settings?tab=help` sem o chat). */
export const settingsTabFromQuery = (tab: string | null | undefined, keys: readonly string[]) =>
    tab && keys.includes(tab) ? tab : keys[0];

// ---------- modal de intensidade (início do DEDA): idioma dos textos, por aparelho ----------

export type IntensityLang = 'en' | 'pt';
export const INTENSITY_LANG_KEY = 'intensityLang';

export const readIntensityLang = (): IntensityLang => {
    try {
        return window.localStorage.getItem(INTENSITY_LANG_KEY) === 'pt' ? 'pt' : 'en';
    } catch {
        return 'en';
    }
};

export const saveIntensityLang = (lang: IntensityLang) => {
    try {
        window.localStorage.setItem(INTENSITY_LANG_KEY, lang);
    } catch {
        // modo privado / armazenamento bloqueado: vale só nesta visita
    }
};

// ---------- molde de cursos (HPEC, Masterclass e os próximos): aulas em sequência ----------

export type CourseLesson = { id: string; title: string; href: string };
export type CourseModule = {
    id: string;
    title: string;
    lessons: CourseLesson[];
    /** texto de liberação (só exibição: "Oct 12" / "Start DEDA to unlock this module"); ausente = módulo liberado */
    locked?: string;
};

/** Aula atual, anterior e próxima entre as aulas LIBERADAS, na ordem dos módulos (a próxima fica a um clique). */
export const lessonNeighbours = (modules: CourseModule[], lessonId: string) => {
    const open = modules.filter((m) => !m.locked).flatMap((m) => m.lessons.map((l) => ({ ...l, module: m })));
    const index = open.findIndex((l) => l.id === lessonId);
    return {
        current: index >= 0 ? open[index] : undefined,
        previous: index > 0 ? open[index - 1] : undefined,
        next: index >= 0 ? open[index + 1] : undefined,
        position: index + 1,
        total: open.length,
    };
};

/** Módulo trancado da aula pedida pela URL (para o estado "unlocks on …"), ou undefined. */
export const lockedModuleOf = (modules: CourseModule[], lessonId: string) =>
    modules.find((m) => !!m.locked && m.lessons.some((l) => l.id === lessonId));

/** Trilho de aulas aberto/recolhido no computador: preferência por aparelho. */
export const LESSON_RAIL_KEY = 'lessonRailCollapsed';

export const readLessonRailCollapsed = (): boolean => {
    try {
        return window.localStorage.getItem(LESSON_RAIL_KEY) === 'true';
    } catch {
        return false;
    }
};

export const saveLessonRailCollapsed = (collapsed: boolean) => {
    try {
        window.localStorage.setItem(LESSON_RAIL_KEY, String(collapsed));
    } catch {
        // modo privado / armazenamento bloqueado: vale só nesta visita
    }
};

/**
 * Módulos abertos/fechados no trilho de aulas: só o que o aluno mudou, por aparelho ({ [moduleId]: aberto }). O que
 * ele não mexeu segue o padrão: aberto só o módulo da aula atual.
 */
export const LESSON_MODULES_KEY = 'lessonRailModules';

export const readOpenModules = (): Record<string, boolean> => {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(LESSON_MODULES_KEY) ?? '{}');
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
};

export const saveOpenModules = (open: Record<string, boolean>) => {
    try {
        window.localStorage.setItem(LESSON_MODULES_KEY, JSON.stringify(open));
    } catch {
        // modo privado / armazenamento bloqueado: vale só nesta visita
    }
};

export const isModuleOpen = (saved: Record<string, boolean>, moduleId: string, currentModuleId?: string) =>
    typeof saved[moduleId] === 'boolean' ? saved[moduleId] : moduleId === currentModuleId;

/** Texto de liberação de cada módulo trancado, sem repetir o mesmo texto do módulo trancado anterior. */
export const lockedNotes = (modules: CourseModule[]) =>
    modules.map((m, i) => (m.locked && m.locked !== modules[i - 1]?.locked ? m.locked : undefined));

/** Tamanho de arquivo legível (mesmas faixas do card de resources atual). */
export const fileSizeLabel = (size: number) =>
    size < 1024
        ? `${size} B`
        : size < 1024 * 1024
          ? `${(size / 1024).toFixed(2)} KB`
          : `${(size / (1024 * 1024)).toFixed(2)} MB`;

// ---------- miniaturas de vídeo (cards do HPEC) ----------

/** Id numérico do Vimeo de um endereço de embed ("https://player.vimeo.com/video/678384632?" → "678384632"). */
export const vimeoIdOf = (embedUrl?: string | null) => /vimeo\.com\/(?:video\/)?(\d+)/.exec(embedUrl ?? '')?.[1];

/**
 * Miniatura do vídeo. A home atual usa vumbnail.com, que devolve uma pasta cinza para os vídeos com domínio
 * restrito (todo o módulo 4 do HPEC, por exemplo). O oEmbed do próprio Vimeo devolve a miniatura quando a página
 * é a da Plataforma (domínio permitido); vumbnail fica como alternativa.
 */
export const vimeoOembedUrl = (id: string) =>
    `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}&width=640`;
export const vumbnailUrl = (id: string) => `https://vumbnail.com/${id}.jpg`;

// ---------- LAMP ----------

/**
 * Campo de tempo "HH:MM" digitado direto (sem modal). Mesmas regras do seletor atual (InputWithTime): horas 0–99,
 * minutos 0–59. Aceita "1:30", "01:30", "130" e "90" (sem dois-pontos, os dois últimos dígitos são os minutos).
 * Devolve o total em minutos, como o campo atual grava (reading time usa o mesmo par como MM:SS → segundos).
 */
export const parseHm = (text: string): number => {
    const clean = text.trim();
    if (!clean) return 0;
    let h: number;
    let m: number;
    if (clean.includes(':')) {
        const [a, b = ''] = clean.split(':');
        h = Number(a.replace(/\D/g, '')) || 0;
        m = Number(b.replace(/\D/g, '')) || 0;
    } else {
        const digits = clean.replace(/\D/g, '');
        h = Number(digits.slice(0, -2)) || 0;
        m = Number(digits.slice(-2)) || 0;
    }
    return Math.min(99, h) * 60 + Math.min(59, m);
};

export const formatHm = (minutes: number) =>
    `${String(Math.floor((minutes || 0) / 60)).padStart(2, '0')}:${String((minutes || 0) % 60).padStart(2, '0')}`;

/** Meta "HH:MM" da API em texto curto: "00:45" → "45 min", "01:45" → "1h45", "03:00" → "3h". */
export const goalLabel = (hhmm?: string) => {
    if (!hhmm) return '—';
    const [h, m] = hhmm.split(':').map((n) => Number(n) || 0);
    if (!h) return `${m} min`;
    return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
};

/** Tempo do relatório da LAMP ("123h 05m", formato do servidor) em minutos; fora do formato → 0. */
export const reportMinutes = (text?: string | null) => {
    const m = /(\d+)h\s*(\d+)m/.exec(text ?? '');
    return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};

/** Minutos no formato do relatório (o mesmo do servidor): 90 → "01h 30m", 7385 → "123h 05m". */
export const reportHm = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}h ${String(minutes % 60).padStart(2, '0')}m`;

/**
 * Atividades do relatório em ranking: as que têm tempo (mais tempo primeiro, ou na ordem do servidor) e, à parte, as
 * ainda sem tempo (na ordem do servidor).
 */
export const rankActivities = <T extends { minutes: number }>(rows: T[], order: 'time' | 'default') => {
    const done = rows.filter((r) => r.minutes > 0);
    return {
        done: order === 'time' ? [...done].sort((a, b) => b.minutes - a.minutes) : done,
        idle: rows.filter((r) => r.minutes <= 0),
    };
};

/** Minutos (com fração) em texto curto: 33 → "33 min", 65 → "1h05", 180 → "3h", 4.5 → "4 min 30 s" (com segundos). */
export const minutesText = (minutes: number, withSeconds = false) => {
    const m = Math.max(0, minutes || 0);
    if (withSeconds && m < 60) {
        const secs = Math.round(m * 60);
        const s = secs % 60;
        return s ? `${Math.floor(secs / 60)} min ${s} s` : `${Math.floor(secs / 60)} min`;
    }
    return goalLabel(formatHm(Math.round(m)));
};

/** Rótulos dos eixos da LAMP em palavras: "W12" → "Week 12", "D02" → "Day 2", "ACTIVE" → "Active". */
export const axisWords = (label: string) =>
    label
        .replace(/^W0*(\d+)$/, 'Week $1')
        .replace(/^D0*(\d+)$/, 'Day $1')
        .replace(/^[A-Z]{3,}$/, (w) => (w === 'DEDA' ? w : w[0] + w.slice(1).toLowerCase()));

/** Balão dos gráficos da LAMP: o valor em destaque e um rótulo curto (texto escapado). */
export const chartTip = (value: string, label: string) => {
    const esc = (t: string) => t.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
    return `<div class="ltip"><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
};

/** Meta do dia em minutos por categoria. O total é a soma (a planilha/API traz um total errado no Flow, semana 52). */
export type GoalDay = { week: number; deda: number; active: number; review: number; passive: number; total: number };
export const goalDays = (rows?: { week: number; deda: string; active: string; review: string; passive: string }[]) =>
    (rows ?? []).map((r) => {
        const [deda, active, review, passive] = [r.deda, r.active, r.review, r.passive].map(
            (t) => parseHm(t ?? '') || 0,
        );
        return { week: r.week, deda, active, review, passive, total: deda + active + review + passive };
    });

/** Primeira semana em que o nível chega à carga cheia (o maior total do programa). */
export const fullLoadWeek = (days: GoalDay[]) => {
    const max = Math.max(0, ...days.map((d) => d.total));
    return days.find((d) => d.total === max)?.week ?? 1;
};

/** Nomes dos 5 níveis das estrelas do DEDA (decisão do André: a qualidade só conta de 4 para cima). Valores 1–5 inalterados. */
export const STAR_NAMES = ['Terrible', 'Bad', 'Still Bad', 'Good', 'Great'] as const;
export const starName = (value?: number) => (value && value >= 1 ? STAR_NAMES[Math.min(5, Math.round(value)) - 1] : '');

/**
 * Tempo do dia contra a meta, como o servidor pontua (min(feito ÷ meta, 100%)): o que conta, o que passou da meta
 * (não conta) e quanto falta.
 */
export const goalProgress = (done: number, goal: number) => {
    const d = Math.max(0, done || 0);
    const g = Math.max(0, goal || 0);
    return {
        counted: Math.min(d, g),
        extra: Math.max(0, d - g),
        missing: Math.max(0, g - d),
        met: g > 0 && d >= g,
        ratio: g > 0 ? Math.min(1, d / g) : d > 0 ? 1 : 0,
    };
};

/** Soma de minutos rápida (+5/+15/+30), no limite do campo (99:59). */
export const addMinutes = (value: number, delta: number) => Math.max(0, Math.min(99 * 60 + 59, (value || 0) + delta));

/**
 * Dia anterior/seguinte na LAMP, atravessando semanas. `weeks` são as semanas que o aluno pode abrir ("week1"…); na
 * semana em curso, só até hoje (mesma regra do seletor). Devolve undefined quando não há para onde ir.
 */
export const stepDay = (
    week: string,
    day: string,
    dir: -1 | 1,
    weeks: string[],
    currentWeek: number | undefined,
    today: number,
) => {
    const w = Number(week.replace('week', ''));
    let d = Number(day.replace('day', '')) + dir;
    let nw = w;
    if (d < 1) {
        nw = w - 1;
        d = 7;
    } else if (d > 7) {
        nw = w + 1;
        d = 1;
    }
    if (!weeks.includes(`week${nw}`)) return undefined;
    if (nw === currentWeek && d > today) return undefined;
    if (currentWeek !== undefined && nw > currentWeek) return undefined;
    return { week: `week${nw}`, day: `day${d}` };
};

/** Limite do campo de tempo (o mesmo de antes: 99:59). */
export const MAX_ENTRY_MINUTES = 99 * 60 + 59;

/**
 * Tempo digitado na aba Input, em minutos primeiro (o aluno digitava "15:00" querendo 15 min e gravava 15 horas):
 * - número inteiro = minutos: "15" → 15, "90" → 90;
 * - número com vírgula/ponto = horas: "1.5" / "1,5" / "1.5h" → 90;
 * - com unidades: "1h30", "1h 30", "1 h 30 min", "2h", "45m", "45 min" → minutos;
 * - "H:MM": "1:30" → 90. Ambíguo: "15:00" (H:00 com H ≥ 10, que daria 10 h ou mais) vira H minutos (15 min) — ninguém
 *   registra 10 h ou mais numa atividade só, e quem quer horas escreve "15h". "10:30" e "15:45" seguem como horas (a
 *   tela pede confirmação acima de 6 h);
 * - vazio → 0; texto sem número → null (o campo volta ao valor anterior). Tudo limitado a 99:59.
 */
export const parseDuration = (text: string): number | null => {
    const t = text.trim().toLowerCase().replace(/,/g, '.').replace(/\s+/g, ' ');
    if (!t) return 0;
    const cap = (m: number) => Math.min(MAX_ENTRY_MINUTES, Math.max(0, Math.round(m)));
    let m: RegExpExecArray | null;
    if ((m = /^(\d+)$/.exec(t))) return cap(Number(m[1]));
    if ((m = /^(\d*\.\d+|\d+\.)\s*(h|hr|hrs|hour|hours)?$/.exec(t))) return cap(Number(m[1]) * 60);
    if ((m = /^(\d{1,3}):(\d{1,2})$/.exec(t))) {
        const h = Number(m[1]);
        const min = Number(m[2]);
        if (min > 59) return null;
        if (min === 0 && h >= 10) return cap(h);
        return cap(h * 60 + min);
    }
    if (
        (m = /^(?:(\d*\.?\d+)\s*(?:h|hr|hrs|hour|hours))?\s*(?:(\d+)\s*(?:m|min|mins|minute|minutes)?)?$/.exec(t)) &&
        (m[1] || m[2])
    ) {
        if (m[1] && m[2] && Number(m[2]) > 59) return null;
        return cap((m[1] ? Number(m[1]) * 60 : 0) + (m[2] ? Number(m[2]) : 0));
    }
    return null;
};

/** Minutos para o campo: "15 min", "1 h 30", "2 h"; zero = vazio (o campo mostra "min" de dica). */
export const durationText = (minutes: number) => {
    const v = Math.max(0, Math.round(minutes || 0));
    if (!v) return '';
    const h = Math.floor(v / 60);
    const m = v % 60;
    if (!h) return `${m} min`;
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
};

/** Registro implausível: 6 h ou mais numa atividade, ou o dia passando de 12 h. Sugestão: as horas lidas como minutos. */
export const implausibleEntry = (minutes: number, dayTotal: number) => {
    if (minutes < 6 * 60 && dayTotal < 12 * 60) return undefined;
    const suggestion = Math.floor(minutes / 60);
    return { suggestion: minutes >= 6 * 60 ? suggestion : undefined };
};

export const WEEK_DAYS = [
    { label: 'Monday', value: 'day1' },
    { label: 'Tuesday', value: 'day2' },
    { label: 'Wednesday', value: 'day3' },
    { label: 'Thursday', value: 'day4' },
    { label: 'Friday', value: 'day5' },
    { label: 'Saturday', value: 'day6' },
    { label: 'Sunday', value: 'day7' },
] as const;

/**
 * Dias que o aluno pode escolher na LAMP (mesma regra do DedaWeekDaySelect atual): na semana em curso, só até hoje;
 * nas semanas passadas, todos. `today` é 1 (segunda) a 7 (domingo).
 */
export const weekDayOptions = (selectedWeek: string, currentWeek: number | undefined, today: number) =>
    Number(selectedWeek.replace('week', '')) === currentWeek ? WEEK_DAYS.slice(0, today) : [...WEEK_DAYS];

/** O dia escolhido cai para hoje quando a semana em curso ainda não chegou nele (mesma regra atual). */
export const clampWeekDay = (day: string, options: readonly { value: string }[]) =>
    options.some((o) => o.value === day) ? day : options[options.length - 1].value;

/** Semana e dia atuais do programa: "Week 05 · Monday". */
export const lampDateLabel = (week: string, day: string) =>
    `Week ${String(Number(week.replace('week', ''))).padStart(2, '0')} · ${
        WEEK_DAYS.find((d) => d.value === day)?.label ?? ''
    }`;

/**
 * Gráficos (ApexCharts) nas páginas novas: as mesmas séries e cores dos hooks da LAMP, só com a fonte da interface,
 * rótulos em peso normal e tons do tema (os hooks ficam como estão).
 */
export const softChart = <T extends { chart?: object; grid?: object; tooltip?: object }>(
    options: T,
    fontFamily: string,
    labelColor = '#bdb4a8',
    light = false,
): T => {
    const label = { colors: labelColor, fontFamily, fontWeight: 400 };
    const axis = (a: unknown) => ({
        ...(a as object),
        labels: { ...((a as { labels?: { style?: object } })?.labels ?? {}), style: label },
    });
    const o = options as T & { xaxis?: unknown; yaxis?: unknown; legend?: object };
    return {
        ...o,
        chart: { ...(o.chart ?? {}), fontFamily, background: 'transparent', foreColor: labelColor },
        grid: { ...(o.grid ?? {}), borderColor: light ? 'rgba(52, 40, 26, 0.1)' : 'rgba(255, 255, 255, 0.07)' },
        tooltip: { ...(o.tooltip ?? {}), theme: light ? 'light' : 'dark' },
        legend: { ...(o.legend ?? {}), fontFamily, fontWeight: 400, labels: { colors: labelColor } },
        xaxis: axis(o.xaxis),
        yaxis: Array.isArray(o.yaxis) ? o.yaxis.map(axis) : axis(o.yaxis),
    };
};
