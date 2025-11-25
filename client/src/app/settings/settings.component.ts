import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto space-y-6">
      <h2 class="text-2xl font-bold text-slate-900">Profile Settings</h2>

      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 class="text-lg font-semibold text-slate-900 mb-6">Personal Information</h3>
        
        <div class="space-y-6">
          <!-- Profile Picture (Mock) -->
          <div class="flex items-center gap-6">
            <div class="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl">
              {{ user?.name?.charAt(0) || user?.email?.charAt(0) || 'U' | uppercase }}
            </div>
            <div>
              <button class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                Change Photo
              </button>
              <div class="mt-1 text-xs text-slate-500">JPG, GIF or PNG. Max size of 800K</div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" [(ngModel)]="user.name" 
                     class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                     placeholder="Enter your name">
            </div>

            <!-- Email (Read-only) -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input type="email" [value]="user.email" disabled
                     class="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed">
            </div>

            <!-- Role (Read-only) -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <input type="text" [value]="user.role | titlecase" disabled
                     class="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed">
            </div>

            <!-- Team (Read-only for now) -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Team</label>
              <input type="text" [value]="user.team_name || 'Unassigned'" disabled
                     class="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed">
            </div>
          </div>
        </div>

        <div class="mt-8 flex justify-end">
          <button (click)="saveProfile()" [disabled]="isSaving"
                  class="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <span *ngIf="isSaving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>

        <div *ngIf="message" [class.text-green-600]="messageType === 'success'" [class.text-red-600]="messageType === 'error'" class="mt-4 text-sm font-medium text-center">
          {{ message }}
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  authService = inject(AuthService);
  
  user: any = {};
  isSaving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  ngOnInit() {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.user = profile;
      },
      error: (err) => console.error('Failed to load profile', err)
    });
  }

  saveProfile() {
    this.isSaving = true;
    this.message = '';

    // Simulate API call or implement real one
    // For now, we'll just update the local state via AuthService if we had an update method
    // Or we can add an update method to AuthService
    
    this.authService.updateProfile({ name: this.user.name }).subscribe({
      next: () => {
        this.isSaving = false;
        this.message = 'Profile updated successfully!';
        this.messageType = 'success';
      },
      error: (err) => {
        console.error(err);
        this.isSaving = false;
        this.message = 'Failed to update profile.';
        this.messageType = 'error';
      }
    });
  }
}
