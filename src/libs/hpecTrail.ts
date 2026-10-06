// Percurso do HPEC na home do IMERSO (plataforma nova). A liberação (dripping) NÃO é calculada aqui: os módulos
// chegam já separados em liberados/trancados por useGetHpecsModules (hooks/queries/hpecQueries), com a mesma data
// de liberação (getUnlockedDate) da página do HPEC. Aqui só se junta tudo na ordem e se marca o que já foi visto.
import { IHPECLesson } from 'interfaces';

export type TrailState = 'done' | 'here' | 'open' | 'locked';

export type TrailLesson = { id: string; title: string; embedUrl: string; state: TrailState };
export type TrailModule = { id: string; order: number; title: string; unlockDate?: string; lessons: TrailLesson[] };

/**
 * Módulos na ordem do curso (moduleOrder), cada aula com seu estado. "Você está aqui" segue a regra da home
 * atual (ComingHpecs / a antiga fila do HPEC): o módulo atual é o ÚLTIMO módulo liberado, e a primeira aula dele é
 * a de assistir. Os módulos liberados antes dele contam como feitos. As marcas "vista" deste aparelho só somam:
 * dentro do módulo atual, "aqui" é a primeira aula ainda não vista e as seguintes ficam abertas. Módulo trancado =
 * trancado (a liberação manda). Sem "aqui" (módulo atual inteiro visto), `next` é a primeira aula trancada.
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
    const currentOrder = Math.max(-Infinity, ...unlocked.map((m) => m.moduleOrder));

    let hereFound = false;
    const modules: TrailModule[] = all.map(({ m, unlockDate }) => ({
        id: m.hpecId,
        order: m.moduleOrder,
        title: m.hpecTitle,
        unlockDate,
        lessons: m.hpecLessonsCollection.items.map((l) => {
            let state: TrailState = 'open';
            if (unlockDate !== undefined) state = 'locked';
            else if (m.moduleOrder < currentOrder || watched.has(l.lessonId)) state = 'done';
            else if (!hereFound) {
                state = 'here';
                hereFound = true;
            }
            return { id: l.lessonId, title: l.lessonTitle, embedUrl: l.lessonVideoEmbedUrl, state };
        }),
    }));

    const flat = modules.flatMap((module) => module.lessons.map((lesson) => ({ lesson, module })));
    const currentIndex = modules.findIndex((module) => module.order === currentOrder);
    return {
        modules,
        here: flat.find((x) => x.lesson.state === 'here'),
        next: hereFound ? undefined : flat.find((x) => x.lesson.state === 'locked'),
        /** "Module N of M": posição do módulo atual (1…M); 0 = nenhum liberado */
        moduleNumber: currentIndex + 1,
        moduleCount: modules.length,
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

// ---------- aulas concluídas: por aluno, no Worker (todos os aparelhos) ----------
// O backend da Plataforma não guarda isso; o Worker mettle-events guarda por uid verificado (GET/PUT, D1).

export const HPEC_PROGRESS_URL = 'https://events.mettle.com.br/plataforma/hpec/progress';
/** Fração do vídeo que conta como vista (o mesmo marco de 90% enviado pelo LessonVideo); o fim do vídeo também conta. */
export const WATCHED_AT = 90;

/** { lessonId: data da conclusão } */
export type DoneMap = Record<string, string>;

/** Marcas antigas, só deste aparelho (até 6-Out-2026): sobem uma vez para o Worker e saem daqui. */
export const WATCHED_KEY = 'lessonsWatched';

export const readWatched = (): Set<string> => {
    try {
        const list = JSON.parse(window.localStorage.getItem(WATCHED_KEY) ?? '[]');
        return new Set(Array.isArray(list) ? list.filter((x) => typeof x === 'string') : []);
    } catch {
        return new Set();
    }
};

export const clearWatched = () => {
    try {
        window.localStorage.removeItem(WATCHED_KEY);
    } catch {
        // armazenamento bloqueado: nada a limpar
    }
};
