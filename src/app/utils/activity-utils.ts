import { ActivityPriority, ActivityType } from "../models/activities.model";

export function getTypeIcon(type: string): string {
    const icons: { [key in ActivityType]: string } = {
        [ActivityType.UPDATE]: 'bi-pencil-square',
        [ActivityType.MILESTONE]: 'bi-flag-fill',
        [ActivityType.ISSUE]: 'bi-exclamation-triangle',
        [ActivityType.MEETING]: 'bi-people-fill',
        [ActivityType.TASK]: 'bi-check2-circle'
    };
    return icons[type as ActivityType] || 'bi-info-circle';
}

export function getPriorityClass(priority: string): string {
    const p = priority as ActivityPriority;
    switch (p) {
        case ActivityPriority.CRITICAL: return 'prio-critical';
        case ActivityPriority.HIGH: return 'prio-high';
        case ActivityPriority.MEDIUM: return 'prio-medium';
        case ActivityPriority.LOW: return 'prio-low';
        default: return 'prio-low';
    }
}

export function getTypeClass(type: string): string {
    const t = type as ActivityType;
    switch (t) {
        case ActivityType.ISSUE: return 'type-issue';
        case ActivityType.MILESTONE: return 'type-milestone';
        case ActivityType.MEETING: return 'type-meeting';
        case ActivityType.TASK: return 'type-task';
        case ActivityType.UPDATE: return 'type-update';
        default: return 'type-update';
    }
}