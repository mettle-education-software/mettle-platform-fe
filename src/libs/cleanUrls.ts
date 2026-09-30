// URLs limpas do Imerso. Só a camada de URL muda: dedaId/hpecId/lessonId continuam
// sendo os identificadores de API, banco, rotação, dripping e notificações.
export const DEDA_ID_PATTERN = /^DEDA\d+$/;
export const HPEC_ID_PATTERN = /^HPEC\d+$/;

export const dedaPath = (dedaSlug: string) => `/imerso/deda/${dedaSlug}`;
export const hpecLessonPath = (lessonId: string) => `/imerso/hpec/${lessonId}`;

// Entrada do HPEC (menu lateral): resolve sem depender da consulta de módulos.
export const HPEC_WELCOME_LESSON = 'welcome';
export const HPEC_WELCOME_MODULE = 'HPEC1';

type HpecModuleLessons = { hpecId: string; hpecLessonsCollection: { items: { lessonId: string }[] } };

export const hpecIdOfLesson = (lessonId: string, modules?: HpecModuleLessons[]) =>
    modules?.find((hpec) => hpec.hpecLessonsCollection.items.some((lesson) => lesson.lessonId === lessonId))?.hpecId ??
    (lessonId === HPEC_WELCOME_LESSON ? HPEC_WELCOME_MODULE : undefined);

export type LegacyLookups = {
    dedaSlugOf: (dedaId: string) => Promise<string | null>;
    firstLessonOf: (hpecId: string) => Promise<string | null>;
};

/**
 * Destino do redirect permanente para uma URL antiga, ou null se não for antiga
 * (ou se não der para resolver — aí a própria rota decide, inclusive 404).
 * - /imerso/deda/DEDA34[/...]          → /imerso/deda/london[/...]
 * - /imerso/hpec/HPEC1/welcome         → /imerso/hpec/welcome
 * - /imerso/hpec/HPEC3/first-lesson    → /imerso/hpec/<primeira aula do módulo>
 */
export const legacyRedirectTarget = async (pathname: string, lookups: LegacyLookups) => {
    const [root, section, id, ...rest] = pathname.split('/').filter(Boolean);
    if (root !== 'imerso' || !id) return null;

    if (section === 'deda' && DEDA_ID_PATTERN.test(id)) {
        const slug = await lookups.dedaSlugOf(id);
        return slug ? [dedaPath(slug), ...rest].join('/') : null;
    }

    if (section === 'hpec' && HPEC_ID_PATTERN.test(id) && rest.length === 1) {
        const lessonId = rest[0] === 'first-lesson' ? await lookups.firstLessonOf(id) : rest[0];
        return lessonId ? hpecLessonPath(lessonId) : null;
    }

    return null;
};
