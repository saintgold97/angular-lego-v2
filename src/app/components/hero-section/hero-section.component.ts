import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-hero-section',
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.scss'],
  standalone: true
})
export class HeroSectionComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';

}
