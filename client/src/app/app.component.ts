import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <header class="mb-8 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl"
            >
              S
            </div>
            <div>
              <h1 class="text-2xl font-bold">ScrumSage AI</h1>
              <p class="text-sm text-slate-500">Powered by Gemini</p>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <a
              routerLink="/"
              routerLinkActive="bg-slate-900 text-white"
              [routerLinkActiveOptions]="{ exact: true }"
              class="px-4 py-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition text-sm font-medium flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </a>
            <a
              routerLink="/post"
              routerLinkActive="bg-slate-900 text-white"
              class="px-4 py-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition text-sm font-medium flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Post Update</span>
            </a>
            <a
              routerLink="/feed"
              routerLinkActive="bg-slate-900 text-white"
              class="px-4 py-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition text-sm font-medium flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Feed</span>
            </a>
            <a
              routerLink="/backlog"
              routerLinkActive="bg-slate-900 text-white"
              class="px-4 py-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition text-sm font-medium flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Backlog</span>
            </a>
          </nav>
        </header>

        <router-outlet></router-outlet>
      </div>
    </div>
  `,
})
export class AppComponent { }
