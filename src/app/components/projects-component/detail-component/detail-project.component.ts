import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FooterComponent } from '../../footer/footer.component';
import { CommonModule } from '@angular/common';
import { LegoCharacter, Project } from '../../../models/characters.model';
import { BehaviorSubject, combineLatest, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { ModalComponent } from '../../modal-component/modal.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { userRoleEnum } from '../../../models/profiles.model';
import { SupabaseService } from '../../../supabase/supabase.service';
import { SingleCharacterComponent } from "../../chars-components/single-character/single-character.component";

@Component({
  selector: 'app-detail-project',
  templateUrl: './detail-project.component.html',
  styleUrls: ['./detail-project.component.scss'],
  imports: [RouterLink, NavbarComponent, FooterComponent, CommonModule, ModalComponent, SingleCharacterComponent],
})

export class DetailProjectComponent implements OnInit {
  projectData$: Observable<Project | null> = of(null);
  userRole$: Observable<userRoleEnum>;
  readonly roles = userRoleEnum;
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);
  selectedProject: Project | null = null;
  membersData$: Observable<LegoCharacter[]> = of([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabase: SupabaseService,
  ) {
    this.userRole$ = this.supabase.getProfileRole();
  }

  ngOnInit() {
    this.projectData$ = combineLatest([
      this.route.paramMap,
      this.refreshTrigger$
    ]).pipe(
      map(([params, _]) => params.get('id')),
      switchMap(id => {
        if (!id) return of(null);
        return this.supabase.getProjectById(id);
      }),
      tap(project => {
        if (project) {
          this.selectedProject = project;
        } else {
          this.router.navigate(['/projects']);
        }
      })
    );

    const projectId$ = combineLatest([
      this.route.paramMap,
      this.refreshTrigger$
    ]).pipe(
      map(([params, _]) => params.get('id')),
      shareReplay(1)
    );

    this.membersData$ = projectId$.pipe(
      switchMap(id => {
        if (!id) return of([]);
        return this.supabase.getCharacters({ project_id: id });
      })
    );
  }

  onProjectUpdated() {
    this.refreshTrigger$.next();
  }

  getMemberIds(members: LegoCharacter[]): string[] {
    return members.map(m => m.id!);
  }
}