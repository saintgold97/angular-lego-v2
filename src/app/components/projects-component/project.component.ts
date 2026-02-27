import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/characters.model';
import { BehaviorSubject, catchError, Observable, of, shareReplay, switchMap } from 'rxjs';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { userRoleEnum } from '../../models/profiles.model';
import { ModalComponent } from "../modal-component/modal.component";
import { GatewaySectionComponent } from "../gateway-section/gateway-section.component";
import { ProfileService } from '../../services/supabase/profile.service';
import { ProjectsService } from '../../services/supabase/projects.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
  imports: [RouterLink, CommonModule, HeroSectionComponent, ModalComponent, GatewaySectionComponent],
})

export class ProjectComponent  {
  projectData$: Observable<Project[]> = of([]);
  userRole$: Observable<userRoleEnum>;
  readonly roles = userRoleEnum;
  private refreshprojects$ = new BehaviorSubject<void>(undefined);

  constructor(private profileService: ProfileService, private projectsService: ProjectsService) {
    this.userRole$ = this.profileService.getProfileRole();
  
    this.projectData$ = this.refreshprojects$.pipe(
      switchMap(() => this.projectsService.getProjects()),
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