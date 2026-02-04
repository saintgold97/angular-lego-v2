import { Component, OnInit } from "@angular/core";
import { UserProfile, userRoleEnum } from "../../models/profiles.model";
import { Observable } from "rxjs";
import { CommonModule } from "@angular/common";
import { SupabaseService } from "../../supabase/supabase.service";

@Component({
    selector: "app-admin-panel",
    templateUrl: "./admin-panel.component.html",
    styleUrls: ["./admin-panel.component.scss"],
    imports: [CommonModule]
})
export class AdminPanelComponent implements OnInit {
    allProfiles$: Observable<UserProfile[]> | null = null;
    userRole$: Observable<userRoleEnum>;
    defaultAvatar = 'img/default-avatar.webp';
    readonly roles = userRoleEnum;

    constructor(private supabase: SupabaseService) {
        this.userRole$ = this.supabase.getProfileRole();
    }

    ngOnInit() {
        // Admin
        this.userRole$.subscribe(role => {
            if (role === this.roles.ADMIN) {
                this.allProfiles$ = this.supabase.getAllProfiles();
            }
        });
    }

    async changeUserRole(userId: string, event: any) {
        const newRole = event.target.value as userRoleEnum;
        const { error } = await this.supabase['supabase']
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            alert("Error updating role: " + error.message);
        } else {
            alert("Role updated successfully.");
        }
    }
}