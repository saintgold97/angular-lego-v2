import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  CONFIRM = 'confirm',
  INFO = 'info'
}

export interface ToastMessage {
  message: string;
  type: ToastType;
  resolve?: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toastSubject = new Subject<ToastMessage | null>();
  toastState$ = this.toastSubject.asObservable();
  private timeoutId: any;

  show(message: string, type: ToastType = ToastType.SUCCESS) {
    this.clearTimeout();
    this.toastSubject.next({ message, type });
    console.log("Toast message:", message);
    
    
    if (type !== ToastType.CONFIRM) {
      this.timeoutId = setTimeout(() => this.close(), 5000);
    }
  }

  confirm(message: string): Promise<boolean> {
    this.clearTimeout();
    
    return new Promise((resolve) => {
      this.toastSubject.next({
        message,
        type: ToastType.CONFIRM,
        resolve
      });
    });
  }

  close(result: boolean = false, toast?: ToastMessage) {
    if (toast?.resolve) {
      toast.resolve(result);
    }
    this.toastSubject.next(null);
    this.clearTimeout();
  }

  private clearTimeout() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }
}