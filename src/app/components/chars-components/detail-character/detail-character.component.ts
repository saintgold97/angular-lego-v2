import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { LegoCharacter } from "../../../models/characters.model";
import { FavoritesService } from "../../../services/favorites.service";
import { CommonModule } from "@angular/common";
import { SupabaseService } from "../../../supabase/supabase.service";
import { Observable, tap, switchMap, of, map, BehaviorSubject, combineLatest } from "rxjs";
import { ModalComponent } from "../../modal-component/modal.component";
import { userRoleEnum } from "../../../models/profiles.model";
import { BreadcrumbComponent } from "../../breadcrumb-component/breadcrumb.component";
import { NotificationService, ToastType } from "../../../services/notification.service";
import { ToastComponent } from "../../toast-component/toast.component";

@Component({
  selector: 'app-detail-character',
  templateUrl: './detail-character.component.html',
  styleUrls: ['./detail-character.component.scss'],
  imports: [CommonModule, ModalComponent, BreadcrumbComponent, ToastComponent],
})
export class DetailCharacterComponent implements OnInit {
  character: Observable<LegoCharacter | null> = of(null);
  isFavorite = new BehaviorSubject<boolean>(false);;
  private currentCharacter: LegoCharacter | null = null;
  userRole$: Observable<userRoleEnum>;
  readonly roles = userRoleEnum;
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);
  selectedCharacter: LegoCharacter | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabase: SupabaseService,
    private favoritesService: FavoritesService,
    private notify: NotificationService
  ) {
    this.userRole$ = this.supabase.getProfileRole();
  }

  ngOnInit() {
    this.character = combineLatest([
      this.route.paramMap, this.refreshTrigger$
    ]).pipe(
      map(([params, _]) => params.get('id')),
      switchMap(id => {
        if (!id) return of(null);
        return this.supabase.getCharacterById(id);
      }),
      tap(character => {
        if (character) {
          this.currentCharacter = character;
          this.selectedCharacter = { ...character };
          this.checkIfFavorite(character);
        } else {
          if (this.route.snapshot.paramMap.get('id')) {
            this.router.navigate(['/characters']);
          }
        }
      })
    );
  }

  async checkIfFavorite(character: LegoCharacter) {
    const status = await this.favoritesService.isFavorite(character.id || '');
    this.isFavorite.next(status);
  }

  async toggleFavorite() {
    if (!this.currentCharacter) return;

    try {
      const newState = await this.favoritesService.toggleFavorite(this.currentCharacter);
      this.isFavorite.next(newState);


      if (newState) {
        this.notify.show(`${this.currentCharacter.name} added to favorites!`, ToastType.SUCCESS);
      } else {
        this.notify.show(`${this.currentCharacter.name} removed from favorites!`, ToastType.SUCCESS);
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      this.notify.show("Error updating favorites. Please try again.", ToastType.ERROR);
    }
  }

  async deleteCharacter(): Promise<void> {
    if (!this.currentCharacter) return;

    const deletedConfirm = await this.notify.confirm(`Are you sure you want to delete "${this.currentCharacter.name} ${this.currentCharacter.lastname}"?`);

    if (!deletedConfirm) return;

    this.supabase.deleteCharacter(this.currentCharacter.id || '').subscribe({
      next: () => {
        this.router.navigate(['/characters']);
        this.notify.show('Character deleted successfully!', ToastType.SUCCESS);
      },
      error: (err) => {
        console.error('Error deleting character:', err);
        this.notify.show('Error deleting character. Please try again.', ToastType.ERROR);
      }
    });
  }

  onCharacterUpdated() {
    this.notify.show('Character updated successfully!', ToastType.SUCCESS);
    this.refreshTrigger$.next();
  }
}
