import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BehaviorSubject, Observable, switchMap, take } from "rxjs";
import { ActivitiesTableComponent } from "./activities-table-component/activities-table.component";
import { Activity } from "../../models/activities.model";
import { ActivitiesListComponent } from "./activities-list-component/activities-list.component";
import { FilterComponent } from "../filter-component/filter.component";
import { ExportDataComponent } from "../export-data-component/export-data.component";
import { ExportService } from "../../services/export.service";
import { ActivitiesService } from "../../services/supabase/activities.service";

@Component({
    selector: 'app-monitoring-activities',
    standalone: true,
    imports: [CommonModule, ActivitiesTableComponent, ActivitiesListComponent, FilterComponent, ExportDataComponent],
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
        switchMap(f => this.activitiesService.getActivities(f.userId, f.projectId, f.date))
    );
    switchSection: boolean = false;
    loadingExport: boolean = false;

    constructor(private activitiesService: ActivitiesService, private exportService: ExportService) { }

    updateFilters(newFilters: any) {
        this.filters$.next(newFilters);
    }

    handleSwitchSection() {
        this.switchSection = !this.switchSection;
    }

    handleExport(format: 'xlsx' | 'pdf') {
        this.loadingExport = true;
        const currentFilters = this.filters$.value;

        this.activities$.pipe(take(1)).subscribe({
            next: (data) => {
                const projectSuffix = currentFilters.projectId ? `_Proj_${currentFilters.projectId}` : '';
                const fileName = `Monitoring_Report${projectSuffix}_${new Date().toISOString().split('T')[0]}`;

                if (format === 'xlsx') {
                    const mappedData = data.map((act: Activity) => ({
                        'User': act.profile?.email || 'N/A',
                        'Date': new Date(act.activity_date).toLocaleDateString('it-IT'),
                        'Project': act.project?.name || 'N/A',
                        'Notes': act.notes || '',
                        'Hours': act.working_hours,
                        'Priority': act.priority,
                        'Type': act.activity_type,
                    }));
                    this.exportService.exportAsExcelFile(mappedData, fileName);
                } else {
                    const columns = ['User','Date', 'Project', 'Notes', 'Hours', 'Priority', 'Type'];
                    const rows = data.map((act: Activity) => [
                        act.profile?.email || 'N/A',
                        new Date(act.activity_date).toLocaleDateString('it-IT'),
                        act.project?.name || 'N/A',
                        act.notes,
                        act.working_hours,
                        act.priority,
                        act.activity_type
                    ]);
                    const pdfTitle = currentFilters.projectId ? `Activities Monitoring: ${data[0]?.project?.name}` : 'General activity monitoring report';
                    this.exportService.exportAsPdfFile(columns, rows, fileName, pdfTitle);
                }
                this.loadingExport = false;
            },
            error: (err) => {
                console.error('Export failed', err);
                this.loadingExport = false;
            }
        });
    }
}