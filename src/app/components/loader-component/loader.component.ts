import { Component, input } from '@angular/core';


@Component({
    selector: 'app-loader',
    standalone: true,
    imports: [],
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {
    message = input<string>('Loading in progress...');
}