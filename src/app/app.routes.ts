import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/components-home/home/home.component';
import { CharactersComponent } from './components/chars-components/characters/characters.component';
import { DetailCharacterComponent } from './components/chars-components/detail-character/detail-character.component';
import { FavoriteComponents } from '../app/components/favorite-components/favorite.component';
import { PageNotFoundComponent } from '../app/components/page-not-found/page-not-found.component';
import { AuthComponent } from './supabase/auth/auth';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';
import { ProjectComponent } from './components/projects-component/project.component';
import { DashboardComponent } from './components/dashboard-component/dashboard.component';

export const routes: Routes = [
  {path: "", component: AuthComponent, canActivate: [LoginGuard]},
  {path: 'home', component: HomeComponent, canActivate: [AuthGuard]},
  {path:'characters',component: CharactersComponent, canActivate: [AuthGuard]},
  {path:'characters/:id',component: DetailCharacterComponent, canActivate: [AuthGuard]},
  { path: 'favorites', component: FavoriteComponents, canActivate: [AuthGuard] },
  { path: 'projects', component: ProjectComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  {path: 'notfound', component: PageNotFoundComponent},
  {path:'**', redirectTo:'notfound'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
