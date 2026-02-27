import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Observable, of } from "rxjs";
import { Project } from "../../models/characters.model";
import { UserProfile, userRoleEnum } from "../../models/profiles.model";
import { CommonModule } from "@angular/common";
import { ProfileService } from "../../services/supabase/profile.service";
import { ProjectsService } from "../../services/supabase/projects.service";

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
    currentFilters = { userId: '', projectId: '', date: '', role: '' };
    @Input() hideUserFilter: boolean = false;
    @Input() hideRolesFilter: boolean = false;
    @Input() hideProjectFilter: boolean = false;
    @Input() hideDateFilter: boolean = false;
    availableRoles$: Observable<string[]> = of(Object.values(userRoleEnum));

    constructor(private profileService: ProfileService, private projectsService: ProjectsService) { }

    ngOnInit() {
        if (!this.hideUserFilter) this.allProfiles$ = this.profileService.getAllProfiles();
        if(!this.hideProjectFilter) this.allProjects$ = this.projectsService.getProjects();
        if(!this.hideRolesFilter) this.availableRoles$;
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

    onRolesChange(event: any) {
        this.currentFilters.role = event.target.value;
        this.notifyChange();
    }

    resetFilters() {
        this.currentFilters = { userId: '', projectId: '', date: '', role: '' };
        if (!this.hideDateFilter) (document.getElementById('dateFilter') as HTMLInputElement).value = '';
        if (!this.hideUserFilter) (document.getElementById('user-select') as HTMLSelectElement).value = '';
        if (!this.hideProjectFilter) (document.getElementById('project-select') as HTMLSelectElement).value = '';
        if (!this.hideRolesFilter) (document.getElementById('roles-select') as HTMLSelectElement).value = '';
        this.notifyChange();
    }
}