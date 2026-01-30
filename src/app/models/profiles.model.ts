export enum userRoleEnum { ADMIN = 'admin', SUPERVISOR = 'supervisor', USER = 'user' }

export interface UserProfile {
    id: string;
    email: string;
    role: userRoleEnum;
    avatar_url?: string;
    display_name?: string;
    password?: string;
}

export enum dashboardSectionEnum {
    PERSONAL_INFO = 'personalInfo',
    ADMIN_PANEL = 'adminPanel',
    ANALYTICS = 'analytics',
    FAVORITES = 'favorites'
};

export type DashboardSection = typeof dashboardSectionEnum[keyof typeof dashboardSectionEnum];