import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Observable } from "rxjs";
import { SupabaseService } from "../../supabase/supabase.service";
import { Project } from "../../models/characters.model";
import { UserProfile } from "../../models/profiles.model";
import { CommonModule } from "@angular/common";

@Component({
    selector: "app-filter",
    templateUrl: "./filter.component.html",
    styleUrls: ["./filter.component.scss"],
    imports: [CommonModule]
})
export class FilterComponent implements OnInit {
    @Output() filterChanged = new EventEmitter<{ userId: string, projectId: string, date: string }>();
    allProfiles$: Observable<UserProfile[]> | null = null;
    allProjects$: Observable<Project[]> | null = null;
    currentFilters = { userId: '', projectId: '', date: '' };
    @Input() hideUserFilter: boolean = false;

    constructor(private supabase: SupabaseService) { }

    ngOnInit() {
        if (!this.hideUserFilter) this.allProfiles$ = this.supabase.getAllProfiles();
        this.allProjects$ = this.supabase.getProjects();
        this.notifyChange();
    }

    notifyChange() {
        this.filterChanged.emit(this.currentFilters);
    }

    onUserChange(event: any) {
        this.currentFilters.userId = event.target.value;
        this.notifyChange();
    }

    onProjectChange(event: any) {
        this.currentFilters.projectId = event.target.value;
        this.notifyChange();
    }

    onDateChange(event: any) {
        this.currentFilters.date = event.target.value;
        this.notifyChange();
    }

    resetFilters() {
        this.currentFilters = { userId: '', projectId: '', date: '' };
        (document.getElementById('dateFilter') as HTMLInputElement).value = '';
        if (!this.hideUserFilter) (document.getElementById('user-select') as HTMLSelectElement).value = '';
        (document.getElementById('project-select') as HTMLSelectElement).value = '';
        this.notifyChange();
    }
}