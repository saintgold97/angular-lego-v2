import { Component, OnInit } from '@angular/core';
import { LegoCharacter } from '../../models/characters.model';
import { FavoritesService } from '../../services/favorites.service';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';
import { SingleCharacterComponent } from "../chars-components/single-character/single-character.component";
import { RouterModule } from '@angular/router';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-favorite-components',
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.scss'],
  imports: [NavbarComponent, FooterComponent, CommonModule, SingleCharacterComponent, RouterModule, HeroSectionComponent],
  standalone: true
})
export class FavoriteComponents implements OnInit {
  favorites: Observable<LegoCharacter[]> | undefined;
  favoritesMap = new Set<string>();
  private refreshFavorites = new BehaviorSubject<void>(undefined);

  constructor(private favoritesService: FavoritesService) { }

  ngOnInit() {
    this.favorites = this.refreshFavorites.pipe(
      switchMap(() => this.favoritesService.getFavorites()),
      tap(favs => {
        this.favoritesMap.clear();
        favs.forEach(c => this.favoritesMap.add(c.email));
      })
    );
  }

  async toggleFavorite(character: LegoCharacter) {
    const deletedConfirm = window.confirm(
      `Are you sure you want to remove "${character.name} ${character.lastname}" from favorites?`
    );

    if (!deletedConfirm) return;

    try {
      await this.favoritesService.toggleFavorite(character);
      alert(`${character.name} has been removed from your favorites.`);
      this.refreshFavorites.next();
    } catch (error) {
      console.error("Error removing favorite:", error);
      alert("An error occurred while removing the favorite.");
    }
  }
}
