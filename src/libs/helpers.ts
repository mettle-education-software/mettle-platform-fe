export const padNumber = (num: number) => {
    return num < 10 ? '0' + num : num.toString();
};

export const getWeekDay = () => {
    const date = new Date();
    const day = date.getDay();
    return day === 0 ? '07' : day.toString().padStart(2, '0');
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
