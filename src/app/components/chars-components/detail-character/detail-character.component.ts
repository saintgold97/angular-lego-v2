import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { LegoCharacter } from "../../../models/characters.model";
import { FavoritesService } from "../../../services/favorites.service";
import { CommonModule } from "@angular/common";
import { FooterComponent } from "../../footer/footer.component";
import { SupabaseService } from "../../../supabase/supabase.service";
import { Observable, tap, switchMap, of, map, BehaviorSubject, combineLatest } from "rxjs";
import { ModalComponent } from "../../modal-component/modal.component";
import { NavbarComponent } from "../../navbar/navbar.component";
import { userRoleEnum } from "../../../models/profiles.model";

@Component({
  selector: 'app-detail-character',
  templateUrl: './detail-character.component.html',
  styleUrls: ['./detail-character.component.scss'],
  imports: [NavbarComponent, FooterComponent, CommonModule, ModalComponent, RouterLink],
  standalone: true
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
    private favoritesService: FavoritesService
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
          this.selectedCharacter = character;
          this.checkIfFavorite(character);
        } else {
          this.router.navigate(['/characters']);
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


      if (this.isFavorite) {
        alert(`${this.currentCharacter.name} has been added to favorites! ⭐`);
      } else {
        alert(`${this.currentCharacter.name} has been removed from favorites!`);
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
      alert("There was an error updating favorites. Please try again.");
    }
  }

  deleteCharacter(): void {
    if (!this.currentCharacter) return;

    const deletedConfirm = window.confirm(
      `Are you sure you want to delete "${this.currentCharacter.name} ${this.currentCharacter.lastname}"?`
    );

    if (!deletedConfirm) return;

    this.supabase.deleteCharacter(this.currentCharacter.id || '').subscribe({
      next: () => {
        this.router.navigate(['/characters']);
        alert('Character deleted successfully!');
      },
      error: (err) => {
        console.error('Error deleting character:', err);
        alert('Error deleting character. Please try again.');
      }
    });
  }

  onCharacterUpdated() {
    alert('Character updated successfully!');
    this.refreshTrigger$.next();
  }
}
