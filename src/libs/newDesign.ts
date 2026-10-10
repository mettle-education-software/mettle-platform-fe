// Plataforma nova ("tuneup", 5-Out-2026): a mesma chave por conta da página nova do DEDA, generalizada para a casca
// (AppLayout) e para as páginas que já têm versão nova. Ponto único: quem vê a plataforma nova é decidido só aqui.
// Chave desligada = nenhum pixel muda para os alunos (componentes novos vêm por next/dynamic; os atuais ficam intactos).
import { DEDA_READER_FORCED_OFF, DEDA_READER_UIDS, isDedaReaderAccount } from './dedaReader';

/** Login público: manter desligado até o lançamento. Preview apenas na URL desta visita. */
export const NEW_LOGIN = false;

/** Texto do cartão da prévia; subtítulo opcional, sem copy de marketing por padrão. */
export const LOGIN_COPY = {
    title: 'Programa Imerso',
    subtitle: '',
};

export const isNewLogin = (preview?: string | null, enabled: boolean = NEW_LOGIN) => enabled || preview === 'novo';

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
    !!pathname && (pathname === '/' || /^\/(imerso|course|settings|guia|suporte|comunidade)(\/|$)/.test(pathname));

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
    if (pathname.startsWith('/suporte')) return ['support'];
    if (pathname.startsWith('/comunidade')) return ['community'];
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

// Palavras que não são nome: tratamento/abreviação com ponto ("Pe.", "Dr.", "Jr."), resto de junção ("undefined") e
// partículas no fim ("Maria de").
const PARTICLES = new Set(['da', 'das', 'de', 'do', 'dos', 'e', 'di', 'du', 'del', 'van', 'von']);
const nameWords = (name?: string | null) =>
    (name ?? '').split(/\s+/).filter((w) => w && !w.endsWith('.') && !/^(undefined|null)$/i.test(w));

/** Primeiro nome, como o cumprimento atual ("Olá, {nome}"). */
export const firstName = (name?: string | null) => nameWords(name)[0] ?? '';

/** Nome curto para o menu: primeiro nome + último sobrenome ("Maria da Silva Souza" → "Maria Souza"). */
export const displayName = (name?: string | null) => {
    const words = nameWords(name);
    const last = [...words.slice(1)].reverse().find((w) => !PARTICLES.has(w.toLowerCase()));
    return [words[0], last].filter(Boolean).join(' ');
};

/** Páginas com cabeçalho próprio (leitor do DEDA) abrem o MESMO menu da casca (gaveta no celular): um menu só. */
export const MENU_OPEN_EVENT = 'mettle-open-menu';
export const openShellMenu = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(MENU_OPEN_EVENT));
};

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
/** Texto de apresentação do Contentful com marcas de ênfase do markdown (___assim___, **assim**): só o texto. */
export const plainEmphasis = (text: string) =>
    // a marca abre e fecha fora de palavra (snake_case fica como está), como no markdown
    text.replace(/(^|[^\w*])(\*{1,3}|_{1,3})(?=\S)([^*_]*?\S)\2(?![\w*])/g, '$1$3');

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

/** Nomes dos 5 níveis das estrelas do DEDA (decisão do André). Valores 1–5 inalterados. */
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

// ---------- LAMP · Performance como espelho ----------

/** Um dia da LAMP, como a aba Input lê (/input/v2): notas do servidor (0–100) e as 5 estrelas do DEDA. */
export type LampDay = {
    week: number;
    day: number;
    /** nota do DEDA no dia: média das estrelas ÷ 5 (0 = não avaliado) */
    deda: number;
    active: number;
    passive: number;
    ratings: number[];
    /** minutos registrados no dia (soma das atividades) */
    activeMin?: number;
    passiveMin?: number;
    /** relógio novo: a data (Brasília) e o DEDA da linha, vindos do servidor */
    iso?: string;
    dedaId?: string | null;
    /** o pedido do dia falhou e não há linha do programa: desconhecido (nunca "nada feito") */
    unknown?: boolean;
};

/** Um dia na DEDA Run: contou (≥ 80%), quebrou (abaixo ou sem DEDA), hoje em andamento, ou ainda por vir. */
export type RunDay = 'counted' | 'broke' | 'today' | 'future';

/** Decisão do André: o dia conta com o DEDA a 80% ou mais (inclusive 80% exato); abaixo disso, a Run zera. */
export const DEDA_QUALITY_MIN = 80;

/** Meta do dia (Daily goal): cumprida = DEDA 80%+ e as metas de Active e Passive; parcial = algo registrado; nada = dia
 * encerrado sem registro (hoje sem nada = neutro, nunca vermelho). */
export type GoalDayStatus = 'met' | 'partial' | 'nothing' | 'today' | 'future';
/**
 * Uma frente (Active/Passive) batida no dia: com a meta conhecida, pelos minutos (o que a tela mostra, "60/1h45");
 * sem ela, pela nota do servidor (min(minutos ÷ meta, 100%)).
 */
export const frontMet = (minutes: number | undefined, goal: number | undefined, score: number) =>
    goal && goal > 0 ? (minutes ?? 0) >= goal : score >= 99.5;

export type DayGoal = { active: number; passive: number };

export const goalDayStatus = (
    d: LampDay | undefined,
    today: boolean,
    future = false,
    goal?: DayGoal,
): GoalDayStatus => {
    if (future) return 'future';
    if (
        d &&
        countsForRun(d.deda) &&
        frontMet(d.activeMin, goal?.active, d.active) &&
        frontMet(d.passiveMin, goal?.passive, d.passive)
    )
        return 'met';
    const any = !!d && (d.deda > 0 || d.active > 0 || d.passive > 0 || !!d.activeMin || !!d.passiveMin);
    if (any) return 'partial';
    // hoje ainda sem nada fica neutro (cinza): vermelho só depois que o dia acabou (meia-noite de Brasília)
    return today ? 'today' : 'nothing';
};

/** Detalhe do dia: "DEDA 84% ✓ · Active 15/20 min · Passive 55/55 min ✓" (✓ só no que foi batido). */
export const dayBreakdown = (d: LampDay | undefined, goal?: DayGoal) => {
    if (!d) return 'Nothing logged';
    const deda = d.deda > 0 ? `DEDA ${Math.round(d.deda)}%${countsForRun(d.deda) ? ' ✓' : ''}` : 'No DEDA';
    const part = (name: string, done: number | undefined, g: number | undefined, score: number) =>
        `${name} ${minutesText(done ?? 0).replace(' min', '')}/${minutesText(g ?? 0)}${frontMet(done, g, score) ? ' ✓' : ''}`;
    return [
        deda,
        part('Active', d.activeMin, goal?.active, d.active),
        part('Passive', d.passiveMin, goal?.passive, d.passive),
    ].join(' · ');
};

/** Hoje não quebra a Run enquanto o dia não acabou: conta se já está ≥ 80%, senão fica pendente. */
export const runDay = (d: LampDay | undefined, today: boolean, future = false): RunDay => {
    if (future) return 'future';
    if (d && countsForRun(d.deda)) return 'counted';
    return today ? 'today' : 'broke';
};

/** 80% exato conta (a nota vem do servidor como média ÷ 5 × 100: folga de arredondamento de ponto flutuante). */
export const countsForRun = (deda: number) => deda >= DEDA_QUALITY_MIN - 1e-9;
const qualifies = (d?: LampDay) => !!d && countsForRun(d.deda);

/**
 * Sequência atual de DEDA bem feito, do dia mais recente para trás (`newestFirst`, o primeiro é hoje). Hoje ainda
 * sem DEDA não quebra a sequência — só com a LAMP contando (`todayPending`): parada, o último dia já acabou.
 * `toEdge`: a sequência chegou ao dia mais antigo carregado (pode ser maior).
 */
export const dedaStreak = (newestFirst: LampDay[], todayPending = true) => {
    let i = qualifies(newestFirst[0]) || !todayPending ? 0 : 1;
    let n = 0;
    for (; i < newestFirst.length && qualifies(newestFirst[i]); i++) n++;
    // chegou ao fim do que foi lido sem achar a quebra (mesmo só com "hoje" pendente): pode ser maior
    return { current: n, toEdge: i >= newestFirst.length };
};

/** Maior sequência dentro dos dias carregados. */
export const bestStreak = (days: LampDay[]) => {
    let best = 0;
    let run = 0;
    for (const d of days) {
        run = qualifies(d) ? run + 1 : 0;
        best = Math.max(best, run);
    }
    return best;
};

/** Sequências de constância (dias seguidos com DEDA ≥ 70%) dentro dos dias carregados, do mais antigo ao mais novo. */
export const constancyRuns = (oldestFirst: LampDay[]) => {
    const runs: { from: LampDay; to: LampDay; days: number }[] = [];
    let start = -1;
    oldestFirst.forEach((d, i) => {
        if (qualifies(d)) {
            if (start < 0) start = i;
        } else if (start >= 0) {
            runs.push({ from: oldestFirst[start], to: oldestFirst[i - 1], days: i - start });
            start = -1;
        }
    });
    if (start >= 0)
        runs.push({
            from: oldestFirst[start],
            to: oldestFirst[oldestFirst.length - 1],
            days: oldestFirst.length - start,
        });
    return runs;
};

/** Run até ontem (sem contar hoje): a base para "+1 → N" e para "faça hoje para chegar a N". */
export const runBeforeToday = (newestFirst: LampDay[]) => {
    let n = 0;
    for (let i = 1; i < newestFirst.length && qualifies(newestFirst[i]); i++) n++;
    return n;
};

/** Run zerada: o dia que quebrou (o mais recente antes de hoje) e quantos dias a Run tinha até ali. */
export const lastBreak = (newestFirst: LampDay[]) => {
    const broke = newestFirst[1];
    if (!broke || qualifies(broke)) return undefined;
    let n = 0;
    for (let i = 2; i < newestFirst.length && qualifies(newestFirst[i]); i++) n++;
    return { day: broke, previous: n };
};

/** As maiores Runs (da maior para a menor; empate: a mais recente primeiro). */
export const topRuns = (oldestFirst: LampDay[], n = 3) =>
    constancyRuns(oldestFirst)
        .map((r, i) => ({ ...r, i }))
        .sort((a, b) => b.days - a.days || b.i - a.i)
        .slice(0, n);

/** Últimas 4 semanas fechadas contra as 4 anteriores (a semana em curso fica de fora). */
export const lastFourVsPrevious = (weekly: number[]) => {
    const closed = weekly.slice(0, -1);
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined);
    const last = avg(closed.slice(-4));
    const prev = closed.length > 4 ? avg(closed.slice(-8, -4)) : undefined;
    return { last, prev, delta: last !== undefined && prev !== undefined ? last - prev : undefined };
};

/** Qualidade do DEDA por semana, só nos dias avaliados: a nota média e a média de cada um dos 5 critérios. */
export const weeklyQuality = (days: LampDay[]) => {
    const byWeek = new Map<number, LampDay[]>();
    for (const d of days) if (d.deda > 0) byWeek.set(d.week, [...(byWeek.get(d.week) ?? []), d]);
    return Array.from(byWeek.entries())
        .sort(([a], [b]) => a - b)
        .map(([week, ds]) => ({
            week,
            score: ds.reduce((t, d) => t + d.deda, 0) / ds.length,
            criteria: [0, 1, 2, 3, 4].map((k) => ds.reduce((t, d) => t + (d.ratings[k] || 0), 0) / ds.length),
            days: ds.length,
        }));
};

// ---------- calendário da LAMP ----------

export const isoPlus = (iso: string, n: number) => {
    const t = new Date(`${iso}T12:00:00Z`);
    t.setUTCDate(t.getUTCDate() + n);
    return t.toISOString().slice(0, 10);
};

/**
 * Dias do programa no calendário (legado, sem a data das linhas): do último dia da LAMP (hoje, com ela contando; o
 * último dia ativo, se parada) para trás, um dia do programa por dia de calendário, pulando os dias em pausa (a pausa
 * congela o programa). Devolve a data de cada dia, os dias pausados (até hoje) e o primeiro dia.
 */
export const calendarDays = (
    newestFirst: LampDay[],
    last: string,
    paused: { from: string; to?: string }[] = [],
    today = last,
) => {
    const isPaused = (iso: string) => paused.some((p) => iso >= p.from && (!p.to || iso < p.to));
    const byDate = new Map<string, LampDay>();
    const pausedDays = new Set<string>();
    let d = last;
    for (const day of newestFirst) {
        while (isPaused(d)) {
            pausedDays.add(d);
            d = isoPlus(d, -1);
        }
        byDate.set(d, day);
        d = isoPlus(d, -1);
    }
    const start = isoPlus(d, 1);
    // pausas depois do início (até hoje) também aparecem como pausa
    for (const p of paused)
        for (let x = p.from; x <= (p.to ? isoPlus(p.to, -1) : today) && x <= today; x = isoPlus(x, 1))
            if (x >= start) pausedDays.add(x);
    return { byDate, pausedDays, start };
};

/** Semanas (segunda a domingo) de um mês: datas AAAA-MM-DD, null fora do mês. */
export const monthGrid = (year: number, month: number) => {
    const first = new Date(Date.UTC(year, month, 1));
    const lead = (first.getUTCDay() + 6) % 7; // segunda = 0
    const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const cells: (string | null)[] = [
        ...Array(lead).fill(null),
        ...Array.from({ length: days }, (_, i) => new Date(Date.UTC(year, month, i + 1)).toISOString().slice(0, 10)),
    ];
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
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

// ---------- eixo das semanas (Weekly progress e DEDA quality) ----------

/** Quantos rótulos o eixo das semanas mostra, sempre nas mesmas posições. */
export const WEEK_TICKS = 10;
/** Faixa do eixo: W1…W10 até a 10ª semana; depois, W1…semana atual. */
export const weekAxisSpan = (current: number) => ({ min: 1, max: Math.max(WEEK_TICKS, Math.round(current) || 1) });
/** Os rótulos nas 10 posições fixas: semanas "redondas", igualmente espaçadas, sempre terminando na atual. */
export const weekTickLabels = (current: number) => {
    const { min, max } = weekAxisSpan(current);
    return Array.from({ length: WEEK_TICKS }, (_, k) => Math.round(min + (k * (max - min)) / (WEEK_TICKS - 1)));
};

// ---------- DEDA Run: marcos ----------

export const RUN_MILESTONES = [7, 30, 50, 100, 200, 365, 500, 730, 1000] as const;
/** Maior marco já alcançado pela Run (0 = nenhum). */
export const runMilestone = (current: number) => RUN_MILESTONES.filter((m) => current >= m).pop() ?? 0;

/**
 * Pontos semana → valor para os gráficos de semanas: o x é o número da semana lido do próprio rótulo ("W12", "Week 12",
 * 12), em ordem crescente, seja qual for a ordem da resposta. Posição, rótulo do eixo e balão saem do mesmo número.
 */
export const weekPoints = (labels: (string | number)[], values: (string | number | null | undefined)[]) =>
    labels
        .map((l, i) => ({ x: Number(String(l).replace(/\D/g, '')) || 0, y: Number(values[i] ?? 0) || 0 }))
        .filter((p) => p.x > 0)
        .sort((a, b) => a.x - b.x);
