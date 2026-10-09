import { IHPECLesson } from 'interfaces';
import { clearWatched, hpecTrail, opensLabel, readWatched } from '../hpecTrail';

const mod = (order: number, ids: string[]): IHPECLesson => ({
    hpecId: `HPEC${order}`,
    hpecTitle: `M${order}`,
    moduleOrder: order,
    drippingDayBeforeDedaStart: 0,
    drippingDayAfterDedaStart: 0,
    hpecLessonsCollection: {
        items: ids.map((id) => ({ lessonId: id, lessonTitle: id, lessonFeaturedText: '', lessonVideoEmbedUrl: '' })),
    },
});
const lock = (order: number, ids: string[], unlockDate = 'Available on: 10/12/2026') => ({
    ...mod(order, ids),
    unlockDate,
});

describe('hpecTrail', () => {
    it('current = last unlocked module (first lesson); earlier modules are done', () => {
        const t = hpecTrail([mod(2, ['c', 'd']), mod(1, ['a', 'b'])], [lock(3, ['e'])], new Set());
        expect(t.modules.map((m) => m.id)).toEqual(['HPEC1', 'HPEC2', 'HPEC3']);
        expect(t.modules.flatMap((m) => m.lessons.map((l) => l.state))).toEqual([
            'done',
            'done',
            'here',
            'open',
            'locked',
        ]);
        expect(t.here?.lesson.id).toBe('c');
        expect([t.moduleNumber, t.moduleCount]).toEqual([2, 3]);
    });

    it('device marks only add: skip watched lessons of the current module', () => {
        const t = hpecTrail([mod(1, ['a', 'b', 'c'])], [], new Set(['a', 'c']));
        expect(t.modules[0].lessons.map((l) => l.state)).toEqual(['done', 'here', 'done']);
    });

    it('current module fully watched: next is the first locked lesson with its date', () => {
        const t = hpecTrail([mod(1, ['a'])], [lock(2, ['b', 'c'])], new Set(['a']));
        expect(t.here).toBeUndefined();
        expect(t.next?.lesson.id).toBe('b');
        expect(t.next?.module.unlockDate).toBe('Available on: 10/12/2026');
    });

    it('watched ids inside locked modules stay locked (drip wins)', () => {
        const t = hpecTrail([], [lock(1, ['a'])], new Set(['a']));
        expect(t.modules[0].lessons[0].state).toBe('locked');
        expect(t.moduleNumber).toBe(0);
    });

    it('empty', () => {
        expect(hpecTrail([], [], new Set())).toMatchObject({ modules: [], total: 0, moduleNumber: 0 });
    });
});

describe('opensLabel', () => {
    const now = new Date(2026, 9, 6);
    it('formats getUnlockedDate text', () => {
        expect(opensLabel('Available on: 10/12/2026', now)).toBe('Opens Oct 12');
        expect(opensLabel('Available on: 1/3/2027', now)).toBe('Opens Jan 3, 2027');
    });
    it('keeps other texts', () => {
        expect(opensLabel('Start DEDA to unlock this module', now)).toBe('Opens with DEDA');
        expect(opensLabel(undefined, now)).toBe('');
    });
});

describe('old device marks (migrated once)', () => {
    it('reads, ignores junk and clears', () => {
        // roda em jsdom ou em node (sem jsdom instalado): um localStorage mínimo basta
        const store: Record<string, string> = {};
        const localStorage = {
            getItem: (k: string) => store[k] ?? null,
            setItem: (k: string, v: string) => void (store[k] = v),
            removeItem: (k: string) => void delete store[k],
        };
        Object.defineProperty(globalThis, 'window', { value: { localStorage }, configurable: true });
        localStorage.setItem('lessonsWatched', '{"x":1}');
        expect(readWatched().size).toBe(0);
        localStorage.setItem('lessonsWatched', '["a",1,"b"]');
        expect([...readWatched()]).toEqual(['a', 'b']);
        clearWatched();
        expect(readWatched().size).toBe(0);
    });
});
