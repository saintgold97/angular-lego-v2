import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Activity } from '../../../models/activities.model';
import { getPriorityClass, getTypeIcon, getTypeClass } from '../../../utils/activity-utils';

@Component({
    selector: 'app-activities-table',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './activities-table.component.html',
    styleUrls: ['./activities-table.component.scss']
})
export class ActivitiesTableComponent {
    protected activitiesSignal = signal<Activity[]>([]);

    @Input() set activities(value: Activity[] | null) {
        this.activitiesSignal.set(value || []);
    }
    @Input() hideProfileDetails: boolean = false;
    @Input() hideButtons: boolean = false;
    @Output() onEditActivity = new EventEmitter<Activity>();
    @Output() onRemoveActivity = new EventEmitter<Activity>();

    getTypeIcon = getTypeIcon;
    getTypeClass = getTypeClass;
    getPriorityClass = getPriorityClass;

    groupedActivities = computed(() => {
        const data = this.activitiesSignal();
        const groups = data.reduce((acc, act) => {
            const projectId = act.project?.id || 'no-project';
            if (!acc[projectId]) {
                acc[projectId] = {
                    projectName: act.project?.name || 'Global / Internal',
                    projectId: projectId,
                    items: []
                };
            }
            acc[projectId].items.push(act);
            return acc;
        }, {} as Record<string, { projectName: string, projectId: string, items: Activity[] }>);

        return Object.values(groups);
    });

    constructor() { }

    editHandler(act: Activity) {
        this.onEditActivity.emit(act);
    }

    removeHandler(event: Event, act: Activity) {
        event.stopPropagation();
        this.onRemoveActivity.emit(act);
    }
}