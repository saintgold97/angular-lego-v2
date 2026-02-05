import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { SupabaseService } from '../../supabase/supabase.service';
import { userRoleEnum } from '../../models/profiles.model';

@Component({
    selector: "app-gateway-section",
    templateUrl: "./gateway-section.component.html",
    styleUrls: ["./gateway-section.component.scss"],
    imports: [CommonModule, RouterLink]
})
export class GatewaySectionComponent {
    userRole$: Observable<userRoleEnum | null>;

    constructor(private supabase: SupabaseService) {
        this.userRole$ = this.supabase.getProfileRole();
    }

    getTexts(role: userRoleEnum | null) {
        switch (role) {
            case userRoleEnum.ADMIN:
                return {
                    title: 'Full System Control.',
                    desc: 'Access advanced analytics, manage all user activities, and oversee global project performance.'
                };
            case userRoleEnum.SUPERVISOR:
                return {
                    title: 'Review & Guide your Team.',
                    desc: 'Monitor team progress, validate activities, and ensure project deadlines are being met.'
                };
            default:
                return {
                    title: 'Elevate Your Productivity.',
                    desc: 'Access your personal area to track activities, manage your tasks, and view real-time reports.'
                };
        }
    }
}