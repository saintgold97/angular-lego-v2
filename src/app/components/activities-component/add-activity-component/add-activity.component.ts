import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Observable } from "rxjs";
import { ActivityType, ActivityPriority, Activity } from "../../../models/activities.model";
import { Project } from "../../../models/characters.model";
import { SupabaseService } from "../../../supabase/supabase.service";
import { CommonModule, TitleCasePipe } from "@angular/common";

@Component({
    selector: "app-add-activity",
    templateUrl: "./add-activity.component.html",
    styleUrls: ["./add-activity.component.scss"],
    imports: [CommonModule, TitleCasePipe, ReactiveFormsModule],
})
export class AddActivityComponent implements OnInit {
    activitiesForm!: FormGroup;
    successMessage: string | null = null;
    errorMessage: string | null = null;
    uploading: boolean = false;
    projects$: Observable<Project[]>;
    readonly activityTypes = Object.values(ActivityType);
    readonly priorities = Object.values(ActivityPriority);
    @Output() activitiesCreated = new EventEmitter<void>();

    constructor(private supabase: SupabaseService, private fb: FormBuilder) {
        this.projects$ = this.supabase.getProjects();
    }

    ngOnInit() {
        this.initForm();
    }

    private initForm() {
        this.activitiesForm = this.fb.nonNullable.group({
            project_id: ['', Validators.required],
            notes: ['', Validators.required],
            activity_type: [ActivityType.UPDATE, Validators.required],
            priority: [ActivityPriority.MEDIUM, Validators.required],
            activity_date: [new Date().toISOString().split('T')[0], Validators.required],
            working_hours: [0, [Validators.required, Validators.min(0)]]
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
            activity_date: new Date().toISOString().split('T')[0],
            working_hours: 0
        });

        setTimeout(() => this.successMessage = null, 3000);
    }
}