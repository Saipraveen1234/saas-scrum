import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  isSignUp = false;
  loading = false;
  message = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.message = '';
    this.error = '';
  }

  async handleLogin() {
    if (!this.email || !this.password) {
      this.error = 'Please enter both email and password.';
      return;
    }

    try {
      this.loading = true;
      this.message = '';
      this.error = '';
      
      if (this.isSignUp) {
        const { error } = await this.authService.signUpWithEmail(this.email, this.password);
        if (error) throw error;
        this.message = 'Registration successful! Please check your email to confirm your account.';
      } else {
        const { error } = await this.authService.signInWithPassword(this.email, this.password);
        if (error) throw error;
        this.router.navigate(['/']);
      }
    } catch (error: any) {
      this.error = error.error_description || error.message;
    } finally {
      this.loading = false;
    }
  }
}
