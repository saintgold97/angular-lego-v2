import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LegoCharacter } from '../../../models/characters.model';
import { ModalComponent } from '../../modal-component/modal.component';
import { RouterLink } from '@angular/router';
import { SingleCharacterComponent } from '../single-character/single-character.component';
import { BehaviorSubject, catchError, combineLatest, Observable, of, shareReplay, switchMap } from 'rxjs';
import { HeroSectionComponent } from '../../hero-section/hero-section.component';
import { userRoleEnum } from '../../../models/profiles.model';
import { GatewaySectionComponent } from "../../gateway-section/gateway-section.component";
import { CharactersService } from '../../../services/supabase/characters.service';
import { ProfileService } from '../../../services/supabase/profile.service';

@Component({
  selector: 'app-characters',
  templateUrl: './characters.component.html',
  styleUrls: ['./characters.component.scss'],
  imports: [
    ModalComponent,
    CommonModule,
    FormsModule,
    RouterLink,
    SingleCharacterComponent,
    HeroSectionComponent,
    GatewaySectionComponent
  ],
})
export class CharactersComponent implements OnInit {
  selectedGender: string = '';
  searchTerm: string = '';
  userRole$: Observable<userRoleEnum>;
  readonly roles = userRoleEnum;
  private refreshCharacters$ = new BehaviorSubject<void>(undefined);
  private filters$ = new BehaviorSubject<{ name?: string; gender?: string }>({});
  characters$: Observable<LegoCharacter[]>;

  constructor(private characterService: CharactersService, private profileService: ProfileService) {
    this.userRole$ = this.profileService.getProfileRole();

    this.characters$ = combineLatest([
      this.refreshCharacters$,
      this.filters$
    ]).pipe(
      switchMap(([_, filters]) => this.characterService.getCharacters(filters)),
      shareReplay(1),
      catchError(err => {
        console.error('Error loading characters:', err);
        return of([]);
      })
    );
  }

  ngOnInit() {
    this.loadCharacters();
  }

  loadCharacters() {
    const filter: { name?: string; gender?: string } = {};
    if (this.selectedGender && this.selectedGender !== 'all') filter.gender = this.selectedGender;
    if (this.searchTerm) filter.name = this.searchTerm;
    this.filters$.next(filter);
  }

  searchCharactersByGender() {
    this.searchTerm = '';

    if (this.selectedGender === 'all') {
      this.selectedGender = "";
    }
    this.loadCharacters();
  }

  searchCharactersByName() {
    this.loadCharacters();
  }

  handleRefresh() {
    this.refreshCharacters$.next();
  }
}
