export enum ActivityType {
    UPDATE = 'update',
    MILESTONE = 'milestone',
    ISSUE = 'issue',
    MEETING = 'meeting',
    TASK = 'task'
}

export enum ActivityPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export interface Activity {
    id?: string;
    project_id: string;
    created_by?: string;
    notes: string;
    activity_type: ActivityType;
    priority: ActivityPriority;
    activity_date: string;
    created_at?: string;
}