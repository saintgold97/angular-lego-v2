import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { NotificationService, ToastMessage, ToastType } from '../../services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent {
  toast$: Observable<ToastMessage | null>
  readonly ToastType = ToastType

  constructor(private notificationService: NotificationService) {
    this.toast$ = this.notificationService.toastState$;
  }

  close(result: boolean, toast: ToastMessage) {
    this.notificationService.close(result, toast);
  }
}
