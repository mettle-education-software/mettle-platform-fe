import { padNumber, getWeekDay, getDayToday, extractYouTubeID, getClosestTimeListValue, nextMondayDate, getUnlockedDate } from '../helpers';

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

describe('nextMondayDate', () => {
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

  it('returns same day if today is monday', () => {
    const iso = '2024-07-01T12:00:00Z';
    mockDate(iso);
    expect(nextMondayDate().toISOString()).toBe(new Date(iso).toISOString());
  });

  it('returns next monday when today is friday', () => {
    const friday = '2024-07-05T12:00:00Z';
    const nextMon = '2024-07-08T12:00:00.000Z';
    mockDate(friday);
    expect(nextMondayDate().toISOString().slice(0,10)).toBe(nextMon.slice(0,10));
  });
});

describe('getUnlockedDate', () => {
  const RealDate = Date;
  afterEach(() => {
    global.Date = RealDate;
  });

  it('returns formatted unlock date string', () => {
    const today = new Date('2024-07-01T12:00:00Z');
    global.Date = class extends RealDate {
      constructor() {
        super('2024-07-01T12:00:00Z');
        return today;
      }
    } as unknown as DateConstructor;
    const result = getUnlockedDate(1, 3); // 2 days later
    const expected = new Date('2024-07-03T12:00:00Z').toLocaleDateString('en-US');
    expect(result).toBe(`Unlocks on: ${expected}`);
  });
});
