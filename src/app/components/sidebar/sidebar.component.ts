import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../supabase/supabase.service';
import { DashboardSection, dashboardSectionEnum, userRoleEnum } from '../../models/profiles.model';
import { Observable } from 'rxjs';
import { ThemeSwitcherComponent } from "../theme-switcher/theme-switcher.component";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeSwitcherComponent],
})
export class SidebarComponent {
  @Input() activeSection: DashboardSection = dashboardSectionEnum.PERSONAL_INFO;
  @Output() sectionChanged = new EventEmitter<DashboardSection>();

  isSidebarOpen = false;
  userRole$: Observable<userRoleEnum>;
  readonly roles = userRoleEnum;
  readonly dashboardSectionEnum = dashboardSectionEnum;

  constructor(private supabase: SupabaseService, private router: Router, private cd: ChangeDetectorRef) {
    this.userRole$ = this.supabase.getProfileRole();
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
    await this.supabase.signOut();
    this.router.navigate(['/']);
    document.body.style.overflow = 'auto';
  };
}