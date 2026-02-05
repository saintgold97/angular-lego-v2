import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/characters.model';
import { BehaviorSubject, catchError, Observable, of, shareReplay, switchMap } from 'rxjs';
import { SupabaseService } from '../../supabase/supabase.service';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { userRoleEnum } from '../../models/profiles.model';
import { ModalComponent } from "../modal-component/modal.component";
import { GatewaySectionComponent } from "../gateway-section/gateway-section.component";

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
  imports: [RouterLink, NavbarComponent, FooterComponent, CommonModule, HeroSectionComponent, ModalComponent, GatewaySectionComponent],
})

export class ProjectComponent  {
  projectData$: Observable<Project[]> = of([]);
  userRole$: Observable<userRoleEnum>;
  readonly roles = userRoleEnum;
  private refreshprojects$ = new BehaviorSubject<void>(undefined);

  constructor(private supabase: SupabaseService) {
    this.userRole$ = this.supabase.getProfileRole();
  
    this.projectData$ = this.refreshprojects$.pipe(
      switchMap(() => this.supabase.getProjects()),
      catchError(err => {
        console.error(err);
        return of([]);
      }),
      shareReplay(1)
    );
  }

  handleRefresh() {
    this.refreshprojects$.next();
  }
}