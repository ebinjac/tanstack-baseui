import type { TimePeriod, MonthInfo } from "./types";

export const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Get current date info
const now = new Date();
export const currentYear = now.getFullYear();
export const currentMonth = now.getMonth() + 1; // 1-12

export const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string; description: string }[] = [
    { value: "1m", label: "Last Month", description: "Current month only" },
    { value: "3m", label: "Last 3 Months", description: "Rolling 3 months" },
    { value: "6m", label: "Last 6 Months", description: "Rolling 6 months" },
    { value: "12m", label: "Last 12 Months", description: "Rolling 12 months" },
    { value: "ytd", label: "Year to Date", description: `Jan - ${MONTHS[currentMonth - 1]} ${currentYear}` },
];

// Available years (last 5 years)
export const AVAILABLE_YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

// Helper: Get months for a time period
export function getMonthsForPeriod(period: TimePeriod): MonthInfo[] {
    const months: MonthInfo[] = [];

    switch (period) {
        case "1m": {
            // Current month only
            months.push({
                year: currentYear,
                month: currentMonth,
                label: `${MONTHS[currentMonth - 1]} ${currentYear}`,
                isFuture: false,
            });
            break;
        }
        case "3m": {
            // Last 3 months including current
            for (let i = 2; i >= 0; i--) {
                let m = currentMonth - i;
                let y = currentYear;
                if (m <= 0) {
                    m += 12;
                    y -= 1;
                }
                months.push({
                    year: y,
                    month: m,
                    label: `${MONTHS[m - 1]} ${y}`,
                    isFuture: false,
                });
            }
            break;
        }
        case "6m": {
            // Last 6 months including current
            for (let i = 5; i >= 0; i--) {
                let m = currentMonth - i;
                let y = currentYear;
                if (m <= 0) {
                    m += 12;
                    y -= 1;
                }
                months.push({
                    year: y,
                    month: m,
                    label: `${MONTHS[m - 1]} ${y}`,
                    isFuture: false,
                });
            }
            break;
        }
        case "12m": {
            // Last 12 months including current
            for (let i = 11; i >= 0; i--) {
                let m = currentMonth - i;
                let y = currentYear;
                if (m <= 0) {
                    m += 12;
                    y -= 1;
                }
                months.push({
                    year: y,
                    month: m,
                    label: `${MONTHS[m - 1]} ${y}`,
                    isFuture: false,
                });
            }
            break;
        }
        case "ytd": {
            // Year to date (Jan to current month)
            for (let m = 1; m <= 12; m++) {
                months.push({
                    year: currentYear,
                    month: m,
                    label: MONTHS[m - 1],
                    isFuture: m > currentMonth,
                });
            }
            break;
        }
    }

    return months;
}

// Helper: Get months for a specific year
export function getMonthsForYear(year: number): MonthInfo[] {
    const months: MonthInfo[] = [];
    for (let m = 1; m <= 12; m++) {
        const isFuture = year > currentYear || (year === currentYear && m > currentMonth);
        months.push({
            year,
            month: m,
            label: MONTHS[m - 1],
            isFuture,
        });
    }
    return months;
}
