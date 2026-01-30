import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { NavbarComponent } from "../navbar/navbar.component";
import { FooterComponent } from "../footer/footer.component";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { SupabaseService } from "../../supabase/supabase.service";
import { HeroSectionComponent } from "../hero-section/hero-section.component";
import { BehaviorSubject, Observable, of, switchMap, tap } from "rxjs";
import { ActivityType, ActivityPriority, Activity } from "../../models/activities.model";
import { CommonModule, TitleCasePipe } from "@angular/common";
import { Project } from "../../models/characters.model";
import { userRoleEnum } from "../../models/profiles.model";
import { EditActivityComponent } from "./edit-activity-component/edit-activity.component";
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-activities',
    templateUrl: './activities.component.html',
    styleUrls: ['./activities.component.scss'],
    imports: [CommonModule, NavbarComponent, FooterComponent, ReactiveFormsModule, HeroSectionComponent, TitleCasePipe, EditActivityComponent, RouterLink],
})
export class ActivitiesComponent implements OnInit {
    activitiesForm!: FormGroup;
    successMessage: string | null = null;
    errorMessage: string | null = null;
    uploading: boolean = false;
    projects$: Observable<Project[]>;
    activities$: Observable<any[]>;
    private refresh$ = new BehaviorSubject<void>(undefined);
    readonly activityTypes = Object.values(ActivityType);
    readonly priorities = Object.values(ActivityPriority);
    @Output() activitiesCreated = new EventEmitter<void>();
    userRole$: Observable<userRoleEnum>;
    readonly roles = userRoleEnum;

    // Edit Activity
    selectedActivity: any | null = null;
    isEditOpen: boolean = false;

    constructor(private fb: FormBuilder, private supabase: SupabaseService) {
        this.projects$ = this.supabase.getProjects();
        this.userRole$ = this.supabase.getProfileRole();

        this.activities$ = this.refresh$.pipe(
            switchMap(() => this.supabase.user$),
            switchMap(user => {
                if (!user) return of([]);
                return this.supabase.getActivities(user.id);
            }),
            tap(() => this.uploading = false)
        );
    }

    ngOnInit() {
        this.initForm();
    }

    private initForm() {
        this.activitiesForm = this.fb.group({
            project_id: ['', Validators.required],
            notes: ['', Validators.required],
            activity_type: [ActivityType.UPDATE, Validators.required],
            priority: [ActivityPriority.MEDIUM, Validators.required],
            activity_date: [new Date().toISOString().split('T')[0], Validators.required]
        });
    }

    onActivitySubmit(): void {
        if (this.activitiesForm.invalid) return;

        this.uploading = true;
        this.successMessage = null;
        this.errorMessage = null;

        const formData: Activity = this.activitiesForm.value;

        try {
            this.supabase.createActivity(formData).subscribe({
                next: () => {
                    this.successMessage = 'Activity created successfully!';
                    this.refresh$.next();
                    this.activitiesCreated.emit();
                    this.resetFormAfterSubmit();
                },
                error: (err) => {
                    console.error('Error creating activity:', err);
                    this.successMessage = null;
                    this.errorMessage = 'Error creating activity. Please try again.';
                }
            });
        } catch (error) {
            console.error('Error creating activity:', error);
        } finally {
            this.uploading = false;
        }
    }

    private resetFormAfterSubmit(): void {
        this.activitiesForm.reset({
            project_id: '',
            notes: '',
            activity_type: ActivityType.UPDATE,
            priority: ActivityPriority.MEDIUM,
            activity_date: new Date().toISOString().split('T')[0]
        });

        setTimeout(() => this.successMessage = null, 3000);
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
        switch (priority) {
            case ActivityPriority.CRITICAL:
            case ActivityPriority.HIGH:
                return 'bg-danger text-white';
            case ActivityPriority.MEDIUM:
                return 'bg-warning text-dark';
            case ActivityPriority.LOW:
                return 'bg-info text-dark';
            default:
                return 'bg-secondary text-white';
        }
    }

    openEdit(activity: any): void {
        this.selectedActivity = { ...activity };
        this.isEditOpen = true;
    }

    onActivityUpdated(): void {
        this.refresh$.next();
        this.successMessage = 'Activity updated successfully!';
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
}