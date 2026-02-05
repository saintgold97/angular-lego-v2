import { Component, Input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
    selector: "app-breadcrumb",
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: "./breadcrumb.component.html",
    styleUrls: ["./breadcrumb.component.scss"],
})
export class BreadcrumbComponent {
    @Input() detailName: string = '';
    
    @Input() parentLabel: string = '';
    @Input() parentLink: string = '';
}