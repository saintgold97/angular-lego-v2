import { Component } from "@angular/core";
import { SupabaseService } from "../../supabase/supabase.service";
import { HeroSectionComponent } from "../hero-section/hero-section.component";
import { BehaviorSubject, Observable, of, switchMap, tap } from "rxjs";
import { CommonModule } from "@angular/common";
import { EditActivityComponent } from "./edit-activity-component/edit-activity.component";
import { AddActivityComponent } from "./add-activity-component/add-activity.component";
import { ActivitiesTableComponent } from "../monitoring-activities-component/activities-table-component/activities-table.component";
import { ActivitiesListComponent } from "../monitoring-activities-component/activities-list-component/activities-list.component";
import { GatewaySectionComponent } from "../gateway-section/gateway-section.component";

@Component({
    selector: 'app-activities',
    templateUrl: './activities.component.html',
    styleUrls: ['./activities.component.scss'],
    imports: [CommonModule, HeroSectionComponent, AddActivityComponent, EditActivityComponent, ActivitiesTableComponent, ActivitiesListComponent, GatewaySectionComponent],
})
export class ActivitiesComponent {
    activities$: Observable<any[]>;
    successMessage: string | null = null;
    errorMessage: string | null = null;
    uploading: boolean = false;
    private refresh$ = new BehaviorSubject<void>(undefined);
    // Edit Activity
    selectedActivity: any | null = null;
    isEditOpen: boolean = false;
    switchSection: boolean = false;

    constructor(private supabase: SupabaseService) {
        this.activities$ = this.refresh$.pipe(
            switchMap(() => this.supabase.user$),
            switchMap(user => {
                if (!user) return of([]);
                return this.supabase.getActivities(user.id);
            }),
            tap(() => this.uploading = false)
        );
    }

    openEdit(activity: any): void {
        this.selectedActivity = { ...activity };
        this.isEditOpen = true;
    }

    onActivityUpdated(): void {
        this.refresh$.next();
        this.successMessage = 'Action completed successfully!';
        setTimeout(() => this.successMessage = null, 3000);
    }

    onDeleteActivity(id: string): void {
        if (confirm('Are you sure you want to delete this activity?')) {
            this.supabase.deleteActivity(id).subscribe({
                next: () => {
                    this.successMessage = 'Activity deleted successfully!';
                    this.refresh$.next();
                    setTimeout(() => this.successMessage = null, 3000);
                },
                error: (err) => {
                    console.error(err);
                    this.errorMessage = 'Error deleting activity. Please try again.';
                }
            });
        }
    }

    handleSwitchSection() {
        this.switchSection = !this.switchSection;
    }
}