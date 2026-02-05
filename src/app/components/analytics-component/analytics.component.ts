import { Component } from "@angular/core";
import { BehaviorSubject, from, map, Observable, shareReplay, switchMap } from "rxjs";
import { SupabaseService } from "../../supabase/supabase.service";
import { CommonModule } from "@angular/common";
import { GraphComponent } from "../graph-component/graph.component";

@Component({
    selector: "app-analytics",
    templateUrl: "./analytics.component.html",
    styleUrls: ["./analytics.component.scss"],
    imports: [CommonModule, GraphComponent],
})

export class AnalyticsComponent {
    stats$: Observable<any> | null = null;
    polarProjectData$: Observable<any> | null = null;
    stackedProjectData$: Observable<any> | null = null;
    recentActivities$: Observable<any> | null = null;
    private refreshProfile$ = new BehaviorSubject<void>(undefined);

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

    constructor(private supabase: SupabaseService) {
        this.loadStatistics();
    }

    private loadStatistics() {
        this.stats$ = this.refreshProfile$.pipe(
            switchMap(() => this.supabase.getGlobalDashboardStats()),
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

        this.recentActivities$ = this.refreshProfile$.pipe(
            switchMap(() => from(this.supabase.getRecentCharactersActivity())),
            map(res => res.data),
            shareReplay(1)
        );
    }
}