import { Component } from "@angular/core";
import { HeroSectionComponent } from "../hero-section/hero-section.component";
import { BehaviorSubject, combineLatest, Observable, of, switchMap, tap, take } from "rxjs";
import { CommonModule } from "@angular/common";
import { EditActivityComponent } from "./edit-activity-component/edit-activity.component";
import { AddActivityComponent } from "./add-activity-component/add-activity.component";
import { ActivitiesTableComponent } from "../monitoring-activities-component/activities-table-component/activities-table.component";
import { ActivitiesListComponent } from "../monitoring-activities-component/activities-list-component/activities-list.component";
import { GatewaySectionComponent } from "../gateway-section/gateway-section.component";
import { FilterComponent } from "../filter-component/filter.component";
import { ExportDataComponent } from "../export-data-component/export-data.component";
import { ExportService } from "../../services/export.service";
import { Activity } from "../../models/activities.model";
import { ActivitiesService } from "../../services/supabase/activities.service";
import { SupabaseClientService } from "../../services/supabase/supabase.client";

@Component({
    selector: 'app-activities',
    templateUrl: './activities.component.html',
    styleUrls: ['./activities.component.scss'],
    imports: [
        CommonModule,
        HeroSectionComponent,
        AddActivityComponent,
        EditActivityComponent,
        ActivitiesTableComponent,
        ActivitiesListComponent,
        GatewaySectionComponent,
        FilterComponent,
        ExportDataComponent
    ],
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
    private filters$ = new BehaviorSubject<{ projectId: string, date: string }>({
        projectId: '',
        date: ''
    });
    loadingExport: boolean = false;


    constructor(private supabaseClientService: SupabaseClientService, private activitiesService: ActivitiesService, private exportService: ExportService) {
        this.activities$ = combineLatest([
            this.refresh$,
            this.filters$,
            this.supabaseClientService.user$
        ]).pipe(
            switchMap(([_, filters, user]) => {
                if (!user) return of([]);
                this.uploading = true;
                return this.activitiesService.getActivities(user.id, filters.projectId, filters.date);
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
            this.activitiesService.deleteActivity(id).subscribe({
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

    updateFilters(newFilters: any) {
        this.filters$.next(newFilters);
    }

    handleExport(format: 'xlsx' | 'pdf') {
        this.loadingExport = true;

        this.activities$.pipe(take(1)).subscribe({
            next: (data) => {
                const fileName = `Report_Activities_${new Date().toISOString().split('T')[0]}`;

                if (format === 'xlsx') {
                    const mappedData = data.map((act: Activity) => ({
                        'Date': new Date(act.activity_date).toLocaleDateString('it-IT'),
                        'Project': act.project?.name || 'N/A',
                        'Notes': act.notes || '',
                        'Hours': act.working_hours,
                        'Priority': act.priority,
                        'Type': act.activity_type,
                    }));
                    this.exportService.exportAsExcelFile(mappedData, fileName);
                } else {
                    const columns = ['Date', 'Project', 'Notes', 'Hours', 'Priority', 'Type'];
                    const rows = data.map((act: Activity) => [
                        new Date(act.activity_date).toLocaleDateString('it-IT'),
                        act.project?.name || 'N/A',
                        act.notes,
                        act.working_hours,
                        act.priority,
                        act.activity_type
                    ]);
                    this.exportService.exportAsPdfFile(columns, rows, fileName, 'Activities Report');
                }
                this.loadingExport = false;
            },
            error: (err) => {
                console.error('Export failed', err);
                this.errorMessage = 'Error exporting data. Please try again.';
                this.loadingExport = false;
            }
        });
    }
}