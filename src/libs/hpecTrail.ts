// Percurso do HPEC na home do IMERSO (plataforma nova). A liberação (dripping) NÃO é calculada aqui: os módulos
// chegam já separados em liberados/trancados por useGetHpecsModules (hooks/queries/hpecQueries), com a mesma data
// de liberação (getUnlockedDate) da página do HPEC. Aqui só se junta tudo na ordem e se marca o que já foi visto.
import { IHPECLesson } from 'interfaces';

export type TrailState = 'done' | 'here' | 'open' | 'locked';

export type TrailLesson = { id: string; title: string; embedUrl: string; state: TrailState };
export type TrailModule = { id: string; order: number; title: string; unlockDate?: string; lessons: TrailLesson[] };

/**
 * Módulos na ordem do curso (moduleOrder), cada aula com seu estado: trancada (módulo trancado), vista, aberta e,
 * entre as liberadas, a primeira ainda não vista = "você está aqui". Sem "aqui" (tudo liberado já visto), `next`
 * é a primeira aula trancada, com a data de liberação do seu módulo.
 */
export const hpecTrail = (
    unlocked: IHPECLesson[],
    locked: ({ unlockDate: string } & IHPECLesson)[],
    watched: ReadonlySet<string>,
) => {
    const all = [
        ...unlocked.map((m) => ({ m, unlockDate: undefined as string | undefined })),
        ...locked.map((m) => ({ m, unlockDate: m.unlockDate })),
    ].sort((a, b) => a.m.moduleOrder - b.m.moduleOrder);

    let hereFound = false;
    const modules: TrailModule[] = all.map(({ m, unlockDate }) => ({
        id: m.hpecId,
        order: m.moduleOrder,
        title: m.hpecTitle,
        unlockDate,
        lessons: m.hpecLessonsCollection.items.map((l) => {
            let state: TrailState = 'open';
            if (unlockDate !== undefined) state = 'locked';
            else if (watched.has(l.lessonId)) state = 'done';
            else if (!hereFound) {
                state = 'here';
                hereFound = true;
            }
            return { id: l.lessonId, title: l.lessonTitle, embedUrl: l.lessonVideoEmbedUrl, state };
        }),
    }));

    const flat = modules.flatMap((module) => module.lessons.map((lesson) => ({ lesson, module })));
    return {
        modules,
        here: flat.find((x) => x.lesson.state === 'here'),
        next: hereFound ? undefined : flat.find((x) => x.lesson.state === 'locked'),
        watched: flat.filter((x) => x.lesson.state === 'done').length,
        total: flat.length,
    };
};

/** "Available on: 10/12/2026" (getUnlockedDate) → "Opens Oct 12"; outro texto ("Start DEDA to unlock…") fica igual. */
export const opensLabel = (unlockDate?: string, now = new Date()) => {
    const m = /^Available on: (.+)$/.exec(unlockDate ?? '');
    if (!m) return unlockDate ?? '';
    const date = new Date(m[1]);
    if (Number.isNaN(date.getTime())) return unlockDate as string;
    const sameYear = date.getFullYear() === now.getFullYear();
    return `Opens ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })}`;
};

// ---------- aulas vistas: neste aparelho ----------
// ponytail: nenhuma API devolve "aula vista" (os marcos do vídeo só vão ao n8n), então fica no aparelho; quando o
// backend expuser o progresso, trocar só estas duas funções.

export const WATCHED_KEY = 'lessonsWatched';
/** Fração do vídeo que conta como vista (o mesmo marco de 90% enviado pelo LessonVideo). */
export const WATCHED_AT = 90;

export const readWatched = (): Set<string> => {
    try {
        const list = JSON.parse(window.localStorage.getItem(WATCHED_KEY) ?? '[]');
        return new Set(Array.isArray(list) ? list.filter((x) => typeof x === 'string') : []);
    } catch {
        return new Set();
    }
};

export const markWatched = (lessonId: string) => {
    try {
        const set = readWatched();
        if (set.has(lessonId)) return;
        set.add(lessonId);
        window.localStorage.setItem(WATCHED_KEY, JSON.stringify([...set]));
    } catch {
        // modo privado / armazenamento bloqueado: vale só nesta visita
    }
};
