export const padNumber = (num: number) => {
    return num < 10 ? '0' + num : num?.toString();
};

export const getWeekDay = () => {
    const date = new Date();
    const day = date.getDay();
    return day === 0 ? '07' : day.toString().padStart(2, '0');
};

export const getDayToday = () => {
    const today = new Date();
    const brazilTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'short',
    }).format(today);
    const dayNumber = brazilTime === 'Sun' ? 7 : today.getDay() === 0 ? 7 : today.getDay();
    return `day${dayNumber}`;
};

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

export const nextMondayDate = () => {
    const isTodayMonday = new Date().getDay() === 1;

    if (isTodayMonday) return new Date();

    const date = new Date();
    const day = date.getDay();
    const diff = 8 - day;
    date.setDate(date.getDate() + diff);
    return date;
};

export const getUnlockedDate = (currentDay: number, drippingDay: number) => {
    const today = new Date();
    const differenceInNumberOfDays = drippingDay - currentDay;
    today.setDate(today.getDate() + differenceInNumberOfDays);

    return `Unlocks on: ${today.toLocaleDateString('en-US')}`;
};
