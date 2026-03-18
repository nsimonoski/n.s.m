import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ThemeToggleComponent } from '@org/angular/ui';

@Component({
  selector: 'ide-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ThemeToggleComponent],
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss'],
})
export class AuthLayoutComponent {
  private readonly router = inject(Router);

  get isLoginRoute(): boolean {
    return this.router.url.startsWith('/login');
  }

  get isFromReact(): boolean {
    return this.router.url.includes('from=react');
  }
}
