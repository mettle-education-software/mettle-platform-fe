import {
    padNumber,
    getWeekDay,
    getDayToday,
    extractYouTubeID,
    getClosestTimeListValue,
    nextMondayDate,
    getUnlockedDate,
    saoPauloWeekday,
} from '../helpers';

describe('padNumber', () => {
    it('pads single digit numbers with zero', () => {
        expect(padNumber(5)).toBe('05');
    });

    it('returns number as string when two digits', () => {
        expect(padNumber(12)).toBe('12');
    });
});

describe('getWeekDay', () => {
    const RealDate = Date;
    afterEach(() => {
        global.Date = RealDate;
    });

    function mockDate(isoDate: string) {
        global.Date = class extends RealDate {
            constructor() {
                super(isoDate);
                return new RealDate(isoDate);
            }
        } as unknown as DateConstructor;
    }

    it('returns 07 for sunday', () => {
        mockDate('2024-06-30T12:00:00Z'); // Sunday
        expect(getWeekDay()).toBe('07');
    });

    it('returns zero padded weekday for monday', () => {
        mockDate('2024-07-01T12:00:00Z'); // Monday
        expect(getWeekDay()).toBe('01');
    });
});

describe('getDayToday', () => {
    const RealDate = Date;
    afterEach(() => {
        global.Date = RealDate;
    });

    function mockDate(isoDate: string) {
        global.Date = class extends RealDate {
            constructor() {
                super(isoDate);
                return new RealDate(isoDate);
            }
        } as unknown as DateConstructor;
    }

    it('returns day number string with sunday as 7', () => {
        mockDate('2024-06-30T12:00:00Z'); // Sunday
        expect(getDayToday()).toBe('day7');
    });
});

describe('extractYouTubeID', () => {
    it('extracts id from url with additional params', () => {
        const url = 'https://youtube.com/watch?v=abc123&feature=youtu.be';
        expect(extractYouTubeID(url)).toBe('abc123');
    });
});

describe('getClosestTimeListValue', () => {
    it('returns 0 for values below 25', () => {
        expect(getClosestTimeListValue(20)).toBe(0);
    });

    it('returns 30 for values between 25 and 30', () => {
        expect(getClosestTimeListValue(28)).toBe(30);
    });

    it('rounds to nearest 5 when units between 3 and 7', () => {
        expect(getClosestTimeListValue(47)).toBe(45);
    });

    it('rounds down when units below 3', () => {
        expect(getClosestTimeListValue(42)).toBe(40);
    });
});

describe('nextMondayDate (regra do servidor, em Brasília)', () => {
    const day = (d: Date) => d.toISOString().slice(0, 10);

    it('segunda: hoje', () => {
        expect(day(nextMondayDate(new Date('2024-07-01T12:00:00Z')))).toBe('2024-07-01');
    });

    it('sexta: a próxima segunda', () => {
        expect(day(nextMondayDate(new Date('2024-07-05T12:00:00Z')))).toBe('2024-07-08');
    });

    it('domingo: amanhã (não a segunda seguinte)', () => {
        expect(day(nextMondayDate(new Date('2026-10-11T15:00:00Z')))).toBe('2026-10-12');
    });

    it('segunda 23h30 em Brasília (terça em UTC): ainda hoje', () => {
        expect(day(nextMondayDate(new Date('2026-10-13T02:30:00Z')))).toBe('2026-10-12');
    });
});

describe('getUnlockedDate', () => {
    it('data de Brasília + dias que faltam', () => {
        expect(getUnlockedDate(1, 3, new Date('2024-07-01T12:00:00Z'))).toBe('Available on: 7/3/2024');
    });

    it('noite de Brasília (dia seguinte em UTC) não adianta a data', () => {
        expect(getUnlockedDate(0, 1, new Date('2026-10-09T01:30:00Z'))).toBe('Available on: 10/9/2026');
    });
});

describe('saoPauloWeekday', () => {
    it('quinta 22h30 em Brasília é 4, mesmo que já seja sexta em UTC', () => {
        expect(saoPauloWeekday(new Date('2026-10-09T01:30:00Z'))).toBe(4);
    });
});
