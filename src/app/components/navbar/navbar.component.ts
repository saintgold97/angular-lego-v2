import { Component, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { Observable, from, map, switchMap, of } from 'rxjs';
import { UserProfile } from '../../models/profiles.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [CommonModule, RouterLink, RouterLinkActive],
})
export class NavbarComponent {
  isMenuOpen = false;
  userData: Observable<Pick<UserProfile, 'avatar_url'>>;
  imgLegoLogo = 'img/Lego_logo.png';

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

  // ===================== NAVBAR =====================
  isFixed: boolean = false;
  isHidden: boolean = false;

  private lastScrollY = 0;
  private readonly FIXED_OFFSET = 120;
  private readonly HIDE_OFFSET = 400;
  private readonly DELTA = 8;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScroll = window.scrollY || 0;
    const diff = currentScroll - this.lastScrollY;

    if (Math.abs(diff) < this.DELTA) return;

    this.isFixed = currentScroll > this.FIXED_OFFSET;

    if (currentScroll > this.HIDE_OFFSET && diff > 0) {
      // scroll down
      this.isHidden = true;
    } else if (diff < 0) {
      // scroll up
      this.isHidden = false;
    }

    this.lastScrollY = currentScroll;
  }

  ngOnInit() {
    if (this.isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  private toggleBodyScroll(lock: boolean) {
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.toggleBodyScroll(this.isMenuOpen);
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.toggleBodyScroll(false);
  }

  signOutHandler() {
    this.user.signOut();
    this.router.navigate(['/']);
  };
};
