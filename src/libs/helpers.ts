export const padNumber = (num: number) => {
    return num < 10 ? '0' + num : num.toString();
};

export const getWeekDay = () => {
    const date = new Date();
    const day = date.getDay();
    return day === 0 ? '07' : day.toString().padStart(2, '0');
};
