import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-section-home',
  templateUrl: './home-section.component.html',
  styleUrls: ['./home-section.component.scss'],
  imports: [RouterLink],
})

export class HomeSectionComponent {
  imgPathCharacters = 'img/lego-characters.webp';
  imgPathProjects = 'img/lego-project.webp';
  imgPathActivity = 'img/lego-activity.webp';
}
