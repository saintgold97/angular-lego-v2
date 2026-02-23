import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Activity, ActivityPriority, ActivityType } from '../../../models/activities.model';
import { Observable } from 'rxjs';
import { Project } from '../../../models/characters.model';
import { SupabaseService } from '../../../supabase/supabase.service';
import { NotificationService, ToastType } from '../../../services/notification.service';
import { ToastComponent } from "../../toast-component/toast.component";

@Component({
  selector: 'app-edit-activity',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastComponent],
  templateUrl: './edit-activity.component.html',
  styleUrls: ['./edit-activity.component.scss']
})
export class EditActivityComponent implements OnChanges {
  @Input() activity: Activity | null = null;
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  editForm: FormGroup = new FormGroup({});
  uploading = false;
  projects$: Observable<Project[]>;
  
  readonly activityTypes = Object.values(ActivityType);
  readonly priorities = Object.values(ActivityPriority);

  constructor(private fb: FormBuilder, private supabase: SupabaseService, private notify: NotificationService) {
    this.projects$ = this.supabase.getProjects();
    this.editForm = this.fb.group({
      project_id: ['', Validators.required],
      notes: ['', [Validators.required, Validators.minLength(5)]],
      activity_type: ['', Validators.required],
      priority: ['', Validators.required],
      activity_date: ['', Validators.required],
      working_hours: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activity'] && this.activity) {
      this.editForm.patchValue(this.activity);
    }
  }

  onSubmit() {
    if (this.editForm.invalid || !this.activity?.id) return;

    this.uploading = true;
    this.supabase.updateActivity(this.activity.id, this.editForm.value).subscribe({
      next: () => {
        this.uploading = false;
        this.notify.show("Activity updated successfully", ToastType.SUCCESS);
        
        this.updated.emit();
        this.close();
      },
      error: (err) => {
        console.error(err);
        this.uploading = false;
        this.notify.show("Error updating activity", ToastType.ERROR);
      }
    });
  }

  close() {
    this.isOpen = false;
    this.closed.emit();
  }
}