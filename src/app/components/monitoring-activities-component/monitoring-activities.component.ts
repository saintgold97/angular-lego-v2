import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BehaviorSubject, map, Observable, switchMap } from "rxjs";
import { SupabaseService } from "../../supabase/supabase.service";
import { ActivitiesTableComponent } from "./activities-table-component/activities-table.component";
import { Activity } from "../../models/activities.model";
import { ActivitiesListComponent } from "./activities-list-component/activities-list.component";
import { FilterComponent } from "../filter-component/filter.component";

@Component({
    selector: 'app-monitoring-activities',
    standalone: true,
    imports: [CommonModule, ActivitiesTableComponent, ActivitiesListComponent, FilterComponent],
    templateUrl: './monitoring-activities.component.html',
    styleUrls: ['./monitoring-activities.component.scss'],
})

export class MonitoringActivitiesComponent {
    private filters$ = new BehaviorSubject<{ userId: string; projectId: string, date: string }>({
        userId: '',
        projectId: '',
        date: ''
    });

    activities$: Observable<Activity[]> = this.filters$.pipe(
        switchMap(f => this.supabase.getActivities(f.userId, f.projectId, f.date))
    );
    switchSection: boolean = false;

    constructor(private supabase: SupabaseService) { }

    updateFilters(newFilters: any) {
        this.filters$.next(newFilters);
    }

    handleSwitchSection() {
        this.switchSection = !this.switchSection;
    }
}