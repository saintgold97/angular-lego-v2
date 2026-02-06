/**
 * Format an array of logs into a heatmap dataset for a given month and year.
 * If a target email is provided, only logs from that user will be included.
 * The heatmap dataset will have two series: standard and overtime.
 * Standard hours are hours worked on weekdays up to the daily limit of 8 hours.
 * Overtime hours are hours worked on weekdays above the daily limit of 8 hours and all hours worked on weekends.
 * @param {any[]} logs - Array of logs to format into a heatmap dataset
 * @param {{ month: number, year: number }} filter - Month and year to format the heatmap for
 * @param {string|null} targetEmail - Email of user to filter logs by, or null to include all users
 * @returns {{ labels: number[], datasets: { label: string, data: number[], backgroundColor: string, borderColor: string, fill: boolean, tension: number }[] }}
 */

export function formatBusinessHeatmap(logs: any[], filter: { month: number, year: number }, targetEmail: string | null) {
    const daysInMonth = new Date(filter.year, filter.month + 1, 0).getDate();
    const standardData = new Array(daysInMonth).fill(0);
    const overtimeData = new Array(daysInMonth).fill(0);
    const dailyLimit = 8;

    const filteredLogs = targetEmail 
        ? logs.filter(l => l.profile_email === targetEmail)
        : logs;

    filteredLogs.forEach(log => {
        const logDate = new Date(log.date);
        if (logDate.getMonth() === filter.month && logDate.getFullYear() === filter.year) {
            const day = logDate.getDate() - 1;
            const hours = Number(log.hours) || 0;
            const isWeekend = logDate.getDay() === 0 || logDate.getDay() === 6;

            if (isWeekend) {
                overtimeData[day] += hours;
            } else {
                const currentDayTotal = standardData[day] + overtimeData[day];
                if (currentDayTotal + hours > dailyLimit) {
                    const roomForStandard = Math.max(0, dailyLimit - currentDayTotal);
                    standardData[day] += roomForStandard;
                    overtimeData[day] += (hours - roomForStandard);
                } else {
                    standardData[day] += hours;
                }
            }
        }
    });

    return {
        labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
        datasets: [
            {
                label: 'Standard (8h)',
                data: standardData,
                backgroundColor: 'rgba(66, 165, 245, 0.5)',
                borderColor: '#42A5F5',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Overtime',
                data: overtimeData,
                backgroundColor: 'rgba(255, 112, 67, 0.5)',
                borderColor: '#FF7043',
                fill: true,
                tension: 0.4
            }
        ]
    };
}

export function getMonthName(monthIndex: number): string {
    return new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2024, monthIndex));
}

export function getColor(index: number): string {
    return GRAPH_COLORS[index % GRAPH_COLORS.length];
}

export const GRAPH_COLORS = ['#42A5F5', '#FF4081', '#FFCE56', '#4CAF50', '#FFA000', '#9C27B0'];