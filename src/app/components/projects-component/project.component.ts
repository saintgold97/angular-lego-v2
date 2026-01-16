import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/characters.model';
import { catchError, map, Observable, of } from 'rxjs';
import { SupabaseService } from '../../supabase/supabase.service';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-section3',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
  standalone: true,
  imports: [RouterModule, NavbarComponent, FooterComponent, CommonModule, HeroSectionComponent],
})

export class ProjectComponent implements OnInit {
  projectData$: Observable<Project[]> = of([]);

  constructor(private supabase: SupabaseService) { }

  ngOnInit() {
    this.loadProjectsData();
  }

  loadProjectsData() {
    this.projectData$ = this.supabase.getGlobalDashboardStats().pipe(
      map(stats => {
        return stats ? stats.projects.detailed : [];
      }),
      catchError((err) => {
        console.error('Error loading project statistics:', err);
        return of([]);
      })
    );
  }
}