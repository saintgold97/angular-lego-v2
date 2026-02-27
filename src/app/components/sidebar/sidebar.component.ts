import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DashboardSection, dashboardSectionEnum, userRoleEnum } from '../../models/profiles.model';
import { Observable } from 'rxjs';
import { ThemeSwitcherComponent } from "../theme-switcher/theme-switcher.component";
import { ProfileService } from '../../services/supabase/profile.service';
import { AuthService } from '../../services/supabase/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [CommonModule, RouterLink, ThemeSwitcherComponent],
})
export class SidebarComponent {
  @Input() activeSection: DashboardSection = dashboardSectionEnum.PERSONAL_INFO;
  @Output() sectionChanged = new EventEmitter<DashboardSection>();

  isSidebarOpen = false;
  userRole$: Observable<userRoleEnum>;
  readonly roles = userRoleEnum;
  readonly dashboardSectionEnum = dashboardSectionEnum;

  constructor(
    private authService: AuthService, 
    private profileService: ProfileService, 
    private router: Router, 
  ) {
    this.userRole$ = this.profileService.getProfileRole();
  }

  private updateBodyOverflow(isOpen: boolean) {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
  }

  setSection(section: DashboardSection) {
    this.sectionChanged.emit(section);
    if (this.isSidebarOpen) {
      this.closeSidebar();
    }
  }
  
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.updateBodyOverflow(this.isSidebarOpen);
  }

  closeSidebar() {
    this.isSidebarOpen = false;
    this.updateBodyOverflow(false);
  }

  async signOutHandler() {
    this.updateBodyOverflow(false);
    await this.authService.signOut();
    this.router.navigate(['/']);
    document.body.style.overflow = 'auto';
  };
}