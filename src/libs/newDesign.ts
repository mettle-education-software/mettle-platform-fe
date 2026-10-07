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
