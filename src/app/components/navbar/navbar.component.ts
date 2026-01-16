import { Component, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { Observable, from, map, switchMap, of } from 'rxjs';
import { UserProfile } from '../../models/profiles.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class NavbarComponent {
  isMenuOpen = false;
  isFixed: boolean = false;
  userData: Observable<Pick<UserProfile, 'avatar_url'>>;

  constructor(private user: SupabaseService, private router: Router) {
    this.userData = this.user.user$.pipe(
      switchMap(authUser => {
        if (!authUser) {
          return of({ avatar_url: 'img/default-avatar.webp' });
        }
        return from(
          this.user['supabase'] 
            .from('profiles')
            .select('avatar_url')
            .eq('id', authUser.id)
            .single()
        ).pipe(
          map(res => {
            if (res.error || !res.data?.avatar_url) {
              return { avatar_url: 'img/default-avatar.webp' };
            }
            return { avatar_url: res.data.avatar_url };
          })
        );
      })
    );
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const offset = window.scrollY || 0;
    this.isFixed = offset > 500;
  };

  ngOnInit() {
    if(this.isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;

    if (this.isMenuOpen) {
      document.body.style.overflow = 'hidden';

    } else {
      document.body.style.overflow = 'auto';
    }
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  signOutHandler() {
    this.user.signOut();
    this.router.navigate(['/']);
  };
};
