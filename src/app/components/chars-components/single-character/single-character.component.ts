import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LegoCharacter } from '../../../models/characters.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-single-character',
  templateUrl: './single-character.component.html',
  styleUrls: ['./single-character.component.scss'],
  imports: [RouterLink],
})
export class SingleCharacterComponent {
  @Input() character: LegoCharacter | undefined;
  @Input() showRemoveButton: boolean = false; 
  @Input() showDetailButton: boolean = false;

  @Output() onRemove = new EventEmitter<LegoCharacter>();

  removeHandler(event: Event) {
    event.stopPropagation();
    if (this.character) {
      this.onRemove.emit(this.character);
    }
  }
}
