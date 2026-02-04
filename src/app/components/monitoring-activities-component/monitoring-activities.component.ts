import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BehaviorSubject, map, Observable, switchMap } from "rxjs";
import { SupabaseService } from "../../supabase/supabase.service";
import { UserProfile } from "../../models/profiles.model";
import { getTypeClass, getPriorityClass, getTypeIcon } from "../../utils/activity-utils";
import { ActivitiesTableComponent } from "./activities-table-component/activities-table.component";
import { Activity } from "../../models/activities.model";
import { Project } from "../../models/characters.model";
import { ActivitiesListComponent } from "./activities-list-component/activities-list.component";

@Component({
    selector: 'app-monitoring-activities',
    standalone: true,
    imports: [CommonModule, ActivitiesTableComponent, ActivitiesListComponent],
    templateUrl: './monitoring-activities.component.html',
    styleUrls: ['./monitoring-activities.component.scss'],
})

export class MonitoringActivitiesComponent implements OnInit {
    allProfiles$: Observable<UserProfile[]> | null = null;
    allProjects$: Observable<Project[]> | null = null;
    
    private filters$ = new BehaviorSubject<{ userId: string; projectId: string }>({
        userId: '',
        projectId: ''
    });

    activities$: Observable<Activity[]> = this.filters$.pipe(
        switchMap(f => this.supabase.getActivities(f.userId, f.projectId))
    );
    switchSection: boolean = false;

    constructor(private supabase: SupabaseService) {}

    ngOnInit() {
        this.allProfiles$ = this.supabase.getAllProfiles();
        this.allProjects$ = this.supabase.getProjects();
    }

    onUserChange(event: any) {
        this.filters$.next({ ...this.filters$.value, userId: event.target.value });
    }

    onProjectChange(event: any) {
        this.filters$.next({ ...this.filters$.value, projectId: event.target.value });
    }

    handleSwitchSection() {
        this.switchSection = !this.switchSection;       
    }
}