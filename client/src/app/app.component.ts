import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StandupService } from './standup.service';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private standupService = inject(StandupService);
  
  chatMessages: { text: string; isUser: boolean }[] = [
    { text: 'How can I assist you today?', isUser: false }
  ];
  userInput = '';
  isChatLoading = false;
  isProfileMenuOpen = false;
  isChatOpen = false;
  isSidebarCollapsed = false;

  constructor(public authService: AuthService, public router: Router) {}

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  get isLoginPage(): boolean {
    return this.router.url.startsWith('/login');
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isChatLoading) return;

    const message = this.userInput;
    this.chatMessages.push({ text: message, isUser: true });
    this.userInput = '';
    this.isChatLoading = true;

    this.standupService.sendChatMessage(message).subscribe({
      next: (res) => {
        this.chatMessages.push({ text: res.response, isUser: false });
        this.isChatLoading = false;
      },
      error: (err) => {
        console.error('Chat error', err);
        this.chatMessages.push({ text: 'Sorry, I encountered an error.', isUser: false });
        this.isChatLoading = false;
      }
    });
  }
}
