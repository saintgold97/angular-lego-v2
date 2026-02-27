import { AfterViewInit, Component, HostListener } from "@angular/core";
import { BehaviorSubject, combineLatest, from, map, Observable, shareReplay, switchMap } from "rxjs";
import { CommonModule } from "@angular/common";
import { GraphComponent } from "../graph-component/graph.component";
import { formatBusinessHeatmap, getColor, getMonthName } from "../../utils/analytics-utils";
import { scrollTo } from "../../utils/scroll-utils";
import { ExportService } from "../../services/export.service";
import { DashboardService } from "../../services/supabase/dashboard.service";

interface DateFilter {
    month: number;
    year: number;
}

@Component({
    selector: "app-analytics",
    templateUrl: "./analytics.component.html",
    styleUrls: ["./analytics.component.scss"],
    imports: [CommonModule, GraphComponent],
})

export class AnalyticsComponent implements AfterViewInit {
    stats$: Observable<any> | null = null;
    polarProjectData$: Observable<any> | null = null;
    stackedProjectData$: Observable<any> | null = null;
    charactersRecentActivities$: Observable<any> | null = null;
    private refreshProfile$ = new BehaviorSubject<void>(undefined);

    // Graph data hours:
    hoursByProjectAndProfile$: Observable<any> | null = null;
    totalHoursPerProject$: Observable<any> | null = null;
    totalHoursPerProfile$: Observable<any> | null = null;
    monthlyActivityHeatmap$: Observable<any> | null = null;

    // FIlter Date
    filterSubject$ = new BehaviorSubject<DateFilter>({
        month: new Date().getMonth(),
        year: new Date().getFullYear()
    });

    selectedUser$ = new BehaviorSubject<string | null>(null);

    // Utils
    getMonthName = getMonthName;
    getColor = getColor;
    scrollTo = scrollTo;

    // Graph options polar
    readonly polarOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { display: false }
            }
        },
        plugins: {
            legend: { position: 'right' }
        }
    };

    // Graph options heatmap
    readonly heatmapOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context: any) => `Day ${context.label}: ${context.raw} hours`
                }
            }
        },
        scales: {
            y: {
                stacked: true,
                title: { display: true, text: 'Total Hours' }
            },
            x: {
                stacked: true,
                title: { display: true, text: 'Day of the Month' }
            }
        }
    };

    constructor(private dashboardService: DashboardService, private exportService: ExportService) {
        this.loadStatistics();
        this.loadTimeAnalytics();
    }

    // Hide sticky nav if sidebar is open
    ngAfterViewInit() {
        const sidebar = document.getElementById('sidebar');
        const stickyNav = document.getElementById('sub-nav');

        if (sidebar && stickyNav) {
            const observer = new MutationObserver(() => {
                if (sidebar.classList.contains('active')) {
                    stickyNav.classList.remove('sticky-top');
                } else {
                    setTimeout(() => stickyNav.classList.add('sticky-top'), 300);
                }
            });

            observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
        }
    }

    @HostListener('window:mousedown')
    checkSidebarInstant() {
        const sidebar = document.getElementById('sidebar');
        const stickyNav = document.getElementById('sub-nav');
        if (sidebar?.classList.contains('active')) {
            stickyNav?.classList.remove('sticky-top');
        }
    }

    private loadStatistics() {
        this.stats$ = this.refreshProfile$.pipe(
            switchMap(() => this.dashboardService.getGlobalDashboardStats()),
            shareReplay(1)
        );

        this.stackedProjectData$ = this.stats$.pipe(
            map(stats => {
                if (!stats || !stats.projects.detailed) return null;

                return {
                    labels: stats.projects.detailed.map((p: any) => p.name),
                    datasets: [
                        {
                            label: 'Males',
                            data: stats.projects.detailed.map((p: any) => p.males),
                            backgroundColor: '#42A5F5'
                        },
                        {
                            label: 'Females',
                            data: stats.projects.detailed.map((p: any) => p.females),
                            backgroundColor: '#FF4081'
                        }
                    ]
                };
            })
        );

        this.polarProjectData$ = this.stats$.pipe(
            map(stats => {
                if (!stats) return null;
                return {
                    labels: stats.projects.labels,
                    datasets: [{
                        data: stats.projects.data,
                        backgroundColor: [
                            '#E3000B',
                            '#0055BF',
                            '#FFD500',
                            '#00843D',
                            '#A5A5A5'
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                };
            })
        );

        this.charactersRecentActivities$ = this.refreshProfile$.pipe(
            switchMap(() => from(this.dashboardService.getRecentCharactersActivity())),
            map(res => res.data),
            shareReplay(1)
        );
    }

    private loadTimeAnalytics() {
        // Time logs
        const timeLogs$ = this.refreshProfile$.pipe(
            switchMap(() => from(this.dashboardService.getTimeLogs())),
            shareReplay(1)
        );


        // 1. Specific hours per project and profile
        this.hoursByProjectAndProfile$ = timeLogs$.pipe(
            map(logs => {
                const projects = [...new Set(logs.map(l => String(l.project_name)))];
                const profiles = [...new Set(logs.map(l => String(l.profile_email)))];

                return {
                    labels: projects,
                    datasets: profiles.map((profile, index) => ({
                        label: profile,
                        data: projects.map(proj =>
                            logs.filter(l => l.project_name === proj && l.profile_email === profile)
                                .reduce((sum, current) => sum + current.hours, 0)
                        ),
                        backgroundColor: this.getColor(index)
                    }))
                };
            })
        );

        // 2. Total hours per project (vertical bar chart)
        this.totalHoursPerProject$ = timeLogs$.pipe(
            map(logs => {
                const projects = [...new Set(logs.map(l => l.project_name))];
                return {
                    labels: projects,
                    data: projects.map(proj =>
                        logs.filter(l => l.project_name === proj)
                            .reduce((acc, curr) => acc + curr.hours, 0)
                    )
                };
            })
        );

        // 3. Total hours per profile (horizontal bar chart)
        this.totalHoursPerProfile$ = timeLogs$.pipe(
            map(logs => {
                const profiles = [...new Set(logs.map(l => l.profile_email))];
                return {
                    labels: profiles,
                    data: profiles.map(prof =>
                        logs.filter(l => l.profile_email === prof)
                            .reduce((acc, curr) => acc + curr.hours, 0)
                    )
                };
            })
        );

        // 4. Monthly activity heatmap
        this.loadMonthlyHeatmap(timeLogs$);
    }

    private loadMonthlyHeatmap(timeLogs$: Observable<any[]>) {
        this.monthlyActivityHeatmap$ = combineLatest([
            timeLogs$,
            this.filterSubject$,
            this.selectedUser$
        ]).pipe(
            map(([logs, filter, user]) => formatBusinessHeatmap(logs, filter, user))
        );
    }

    onUserChange(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        const value = selectElement.value;

        const userValue = value === 'null' ? null : value;
        this.selectedUser$.next(userValue);
    }

    changeMonth(offset: number) {
        const current = this.filterSubject$.value;
        let newMonth = current.month + offset;
        let newYear = current.year;

        if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        } else if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        }

        this.filterSubject$.next({ month: newMonth, year: newYear });
    }

    exportCharactersAnalytics() {
        this.exportService.exportAnalyticsAsPdf(
            'character-analytics', 
            `characters-analytics.${new Date().toISOString().split('T')[0]}`, 
            'Characters Analytics'
        );
    }

    exportTimesheetAnalytics() {
        this.exportService.exportAnalyticsAsPdf(
            'timesheet-analytics', 
            `timesheet-analytics.${new Date().toISOString().split('T')[0]}`, 
            'Timesheet Analytics'
        );
    }
}