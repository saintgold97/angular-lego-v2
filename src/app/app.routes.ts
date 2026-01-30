import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import('./supabase/auth/auth').then(m => m.AuthComponent),
    canActivate: [LoginGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./components/components-home/home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'characters',
    loadComponent: () => import('./components/chars-components/characters/characters.component').then(m => m.CharactersComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'characters/:id',
    loadComponent: () => import('./components/chars-components/detail-character/detail-character.component').then(m => m.DetailCharacterComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'projects',
    loadComponent: () => import('./components/projects-component/project.component').then(m => m.ProjectComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./components/projects-component/detail-component/detail-project.component').then(m => m.DetailProjectComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard-component/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'activities',
    loadComponent: () => import('./components/activities-component/activities.component').then(m => m.ActivitiesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'notfound',
    loadComponent: () => import('./components/page-not-found/page-not-found.component').then(m => m.PageNotFoundComponent)
  },
  { path: '**', redirectTo: 'notfound' },
];