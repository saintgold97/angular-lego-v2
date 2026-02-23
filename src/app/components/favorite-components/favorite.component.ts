import { Component, OnInit } from '@angular/core';
import { LegoCharacter } from '../../models/characters.model';
import { FavoritesService } from '../../services/favorites.service';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';
import { SingleCharacterComponent } from "../chars-components/single-character/single-character.component";
import { NotificationService, ToastType } from '../../services/notification.service';
import { ToastComponent } from "../toast-component/toast.component";

@Component({
  selector: 'app-favorite-components',
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.scss'],
  imports: [CommonModule, SingleCharacterComponent, ToastComponent],
})
export class FavoriteComponents implements OnInit {
  favorites: Observable<LegoCharacter[]> | undefined;
  favoritesMap = new Set<string>();
  private refreshFavorites = new BehaviorSubject<void>(undefined);
  imgEmptyFavorites = 'img/empty-favorites.webp';

  constructor(private favoritesService: FavoritesService, private notify: NotificationService) { }

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
    const deletedConfirm = await this.notify.confirm(`Are you sure you want to remove "${character.name} ${character.lastname}" from favorites?`);

    if (!deletedConfirm) return;

    try {
      await this.favoritesService.toggleFavorite(character);
      this.notify.show(`${character.name} removed from favorites!`, ToastType.SUCCESS);
      this.refreshFavorites.next();
    } catch (error) {
      console.error("Error removing favorite:", error);
      this.notify.show("Error removing favorite. Please try again.", ToastType.ERROR);
    }
  }
}
