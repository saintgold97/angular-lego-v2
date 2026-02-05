import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../supabase/supabase.service';
import { DashboardSection, dashboardSectionEnum, userRoleEnum } from '../../models/profiles.model';
import { Observable } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FavoriteComponents } from "../favorite-components/favorite.component";
import { AdminPanelComponent } from "../admin-panel-component/admin-panel.component";
import { MonitoringActivitiesComponent } from "../monitoring-activities-component/monitoring-activities.component";
import { AnalyticsComponent } from "../analytics-component/analytics.component";
import { PersonalProfileComponent } from "../personal-profile-component/personal-profile.component";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    SidebarComponent,
    FavoriteComponents,
    AdminPanelComponent,
    MonitoringActivitiesComponent,
    AnalyticsComponent,
    PersonalProfileComponent
  ],
})

export class DashboardComponent implements OnInit {
  userRole$: Observable<userRoleEnum>;
  readonly roles = userRoleEnum;
  activeSection: DashboardSection = dashboardSectionEnum.PERSONAL_INFO;
  readonly dashboardSectionEnum = dashboardSectionEnum;

  constructor(private supabase: SupabaseService, private route: ActivatedRoute, private cd: ChangeDetectorRef) {
    this.userRole$ = this.supabase.getProfileRole();
  }

  ngOnInit() {
    // Sidebar control section change
    this.route.fragment.subscribe(fragment => {
      const targetSection = (fragment as DashboardSection) || dashboardSectionEnum.PERSONAL_INFO;
      this.setSection(targetSection);
      this.cd.detectChanges();
    });
  }

  setSection(section: DashboardSection) {
    this.activeSection = section;
  }
}