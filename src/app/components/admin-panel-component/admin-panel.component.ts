import { Component } from "@angular/core";
import { UserProfile, userRoleEnum } from "../../models/profiles.model";
import { BehaviorSubject, Observable, switchMap, take } from "rxjs";
import { CommonModule } from "@angular/common";
import { SupabaseService } from "../../supabase/supabase.service";
import { ExportDataComponent } from "../export-data-component/export-data.component";
import { FilterComponent } from "../filter-component/filter.component";
import { ExportService } from "../../services/export.service";
import { NotificationService, ToastType } from "../../services/notification.service";
import { ToastComponent } from "../toast-component/toast.component";

@Component({
    selector: "app-admin-panel",
    templateUrl: "./admin-panel.component.html",
    styleUrls: ["./admin-panel.component.scss"],
    imports: [CommonModule, ExportDataComponent, FilterComponent, ToastComponent]
})
export class AdminPanelComponent {
    allProfiles$: Observable<UserProfile[]>;
    userRole$: Observable<userRoleEnum>;
    defaultAvatar = 'img/default-avatar.webp';
    readonly roles = userRoleEnum;
    private filters$ = new BehaviorSubject<{role: string }>({ role: '' });
    loadingExport: boolean = false;

    constructor(private supabase: SupabaseService, private exportService: ExportService, private notify: NotificationService) {
        this.userRole$ = this.supabase.getProfileRole();
        this.allProfiles$ = this.filters$.pipe(
            switchMap(f => this.supabase.getAllProfiles(f.role))
        );
    }

    async changeUserRole(userId: string, event: any) {
        const newRole = event.target.value as userRoleEnum;
        const { error } = await this.supabase['supabase']
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            this.notify.show(error.message, ToastType.ERROR);
        } else {
            this.notify.show("Role updated successfully.", ToastType.SUCCESS);
        }
    }

    updateFilters(newFilters: any) {
        this.filters$.next({
            role: newFilters.role
        });
    }

    handleExport(format: 'xlsx' | 'pdf') {
       this.loadingExport = true;
       const currentFilters = this.filters$.value;

       this.allProfiles$.pipe(take(1)).subscribe({
           next: (data) => {
               const projectSuffix = currentFilters.role ? `_Role_${currentFilters.role}` : '';
               const fileName = `Users${projectSuffix}_${new Date().toISOString().split('T')[0]}`;

               if(format === 'xlsx') {
                   const mappedData = data.map((profile: UserProfile) => ({
                       'Email': profile.email,
                       'Display Name': profile.display_name,
                       'Role': profile.role,
                       
                   }));
                   this.exportService.exportAsExcelFile(mappedData, fileName);
               } else {
                   const columns = ['Email', 'Display Name', 'Role'];
                   const rows = data.map((profile: UserProfile) => [
                       profile.email,
                       profile.display_name,
                       profile.role,
                   ]);
                   const pdfTitle = currentFilters.role ? `Users Report: ${currentFilters.role}` : 'Users Report';
                   this.exportService.exportAsPdfFile(columns, rows, fileName, pdfTitle);
               }
               this.loadingExport = false;
            },
       });
    }
}