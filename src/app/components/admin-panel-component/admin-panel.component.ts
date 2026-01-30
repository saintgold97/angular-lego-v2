import { Component, OnInit } from "@angular/core";
import { UserProfile, userRoleEnum } from "../../models/profiles.model";
import { BehaviorSubject, Observable, switchMap } from "rxjs";
import { CommonModule } from "@angular/common";
import { SupabaseService } from "../../supabase/supabase.service";
import { ActivityPriority, ActivityType } from "../../models/activities.model";
import { RouterLink } from "@angular/router";

@Component({
    selector: "app-admin-panel",
    templateUrl: "./admin-panel.component.html",
    styleUrls: ["./admin-panel.component.scss"],
    imports: [CommonModule, RouterLink]
})
export class AdminPanelComponent implements OnInit {
    allProfiles$: Observable<UserProfile[]> | null = null;
    userRole$: Observable<userRoleEnum>;
    defaultAvatar = 'img/default-avatar.webp';
    readonly roles = userRoleEnum;
    selectedUserId$ = new BehaviorSubject<string>('');
    activities$ = this.selectedUserId$.pipe(
        switchMap(userId => this.supabase.getActivities(userId))
    );

    constructor(private supabase: SupabaseService) {
        this.userRole$ = this.supabase.getProfileRole();
    }

    ngOnInit() {
        // Admin
        this.userRole$.subscribe(role => {
            if (role === this.roles.ADMIN) {
                this.allProfiles$ = this.supabase.getAllProfiles();
            }
        });
    }

    async changeUserRole(userId: string, event: any) {
        const newRole = event.target.value as userRoleEnum;
        const { error } = await this.supabase['supabase']
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            alert("Error updating role: " + error.message);
        } else {
            alert("Role updated successfully.");
        }
    }

    onUserChange(event: any) {
        this.selectedUserId$.next(event.target.value);
    }

    getTypeIcon(type: string): string {
        const icons: { [key in ActivityType]: string } = {
            [ActivityType.UPDATE]: 'bi-pencil-square',
            [ActivityType.MILESTONE]: 'bi-flag-fill',
            [ActivityType.ISSUE]: 'bi-exclamation-triangle',
            [ActivityType.MEETING]: 'bi-people-fill',
            [ActivityType.TASK]: 'bi-check2-circle'
        };
        return icons[type as ActivityType] || 'bi-info-circle';
    }

    getPriorityClass(priority: string): string {
        const p = priority as ActivityPriority;
        switch (p) {
            case ActivityPriority.CRITICAL: return 'prio-critical';
            case ActivityPriority.HIGH: return 'prio-high';
            case ActivityPriority.MEDIUM: return 'prio-medium';
            case ActivityPriority.LOW: return 'prio-low';
            default: return 'prio-low';
        }
    }

    getTypeClass(type: string): string {
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
}