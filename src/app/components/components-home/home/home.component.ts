import { Component } from '@angular/core';
import { HomeSectionComponent } from '../home-section/home-section.component';
import { HeroSectionComponent } from '../../hero-section/hero-section.component';
import { GatewaySectionComponent } from "../../gateway-section/gateway-section.component";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [HeroSectionComponent, HomeSectionComponent, GatewaySectionComponent],
})
export class HomeComponent {

}
