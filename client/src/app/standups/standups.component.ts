import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StandupService, Standup } from '../standup.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-standups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Daily Standups</h1>
          <p class="text-slate-500">Track team progress and blockers</p>
        </div>
        <div class="flex items-center gap-3">
          <input 
            type="date" 
            [ngModel]="selectedDate" 
            (ngModelChange)="onDateChange($event)"
            class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
          
          <button 
            (click)="togglePostForm()"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Post Update
          </button>
        </div>
      </div>

      <!-- Post Form (Collapsible) -->
      <div *ngIf="showPostForm" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in-down">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-semibold text-slate-900">Post Your Standup</h3>
          <button (click)="togglePostForm()" class="text-slate-400 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-slate-700">Yesterday</label>
            <textarea [(ngModel)]="newStandup.yesterday" rows="3" class="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="What did you complete?"></textarea>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-slate-700">Today</label>
            <textarea [(ngModel)]="newStandup.today" rows="3" class="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="What will you work on?"></textarea>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-slate-700">Blockers</label>
            <textarea [(ngModel)]="newStandup.blockers" rows="3" class="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Any impediments?"></textarea>
          </div>
        </div>

        <div class="mt-4 flex justify-end">
          <button 
            (click)="submitStandup()" 
            [disabled]="isSubmitting"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {{ isSubmitting ? 'Posting...' : 'Post Update' }}
          </button>
        </div>
      </div>

      <!-- AI Summary Section -->
      <div class="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-indigo-900">AI Daily Summary</h3>
              <p class="text-xs text-indigo-600">Auto-generated insights from team updates</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button 
              (click)="generateSummary()" 
              [disabled]="isGeneratingSummary"
              class="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-50 disabled:opacity-50 transition-colors">
              {{ isGeneratingSummary ? 'Generating...' : 'Regenerate' }}
            </button>
            <button 
              *ngIf="summary"
              (click)="postToSlack()"
              class="px-3 py-1.5 bg-[#4A154B] text-white rounded-lg text-xs font-medium hover:bg-[#3b113c] transition-colors flex items-center gap-1">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.52v-6.315zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.521A2.527 2.527 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.52h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
              Post to Slack
            </button>
          </div>
        </div>
        
        <div *ngIf="summary" class="prose prose-sm text-slate-700 max-w-none whitespace-pre-wrap bg-white/50 p-4 rounded-lg border border-indigo-50">
          {{ summary }}
        </div>
        <div *ngIf="!summary && !isGeneratingSummary" class="text-sm text-slate-500 italic text-center py-4">
          No summary generated yet. Click regenerate to analyze today's updates.
        </div>
        <div *ngIf="isGeneratingSummary" class="space-y-2 p-4">
          <div class="h-4 bg-indigo-100 rounded w-3/4 animate-pulse"></div>
          <div class="h-4 bg-indigo-100 rounded w-1/2 animate-pulse"></div>
          <div class="h-4 bg-indigo-100 rounded w-5/6 animate-pulse"></div>
        </div>
      </div>

      <!-- Standups List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let standup of filteredStandups" class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
              {{ standup.user_name.charAt(0) | uppercase }}
            </div>
            <div>
              <h4 class="font-semibold text-slate-900">{{ standup.user_name }}</h4>
              <p class="text-xs text-slate-500">{{ standup.created_at | date:'shortTime' }}</p>
            </div>
          </div>
          
          <div class="space-y-3 text-sm">
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Yesterday</span>
              <p class="text-slate-700 mt-1">{{ standup.yesterday }}</p>
            </div>
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Today</span>
              <p class="text-slate-700 mt-1">{{ standup.today }}</p>
            </div>
            <div *ngIf="standup.blockers && standup.blockers !== 'None'">
              <span class="text-xs font-bold text-red-500 uppercase tracking-wider">Blockers</span>
              <p class="text-red-600 mt-1 bg-red-50 p-2 rounded">{{ standup.blockers }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div *ngIf="filteredStandups.length === 0" class="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
        <p class="text-slate-500">No standups posted for this date.</p>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in-down {
      animation: fadeInDown 0.3s ease-out;
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class StandupsComponent implements OnInit {
  standups: Standup[] = [];
  filteredStandups: Standup[] = [];
  selectedDate: string = '';
  
  showPostForm = false;
  isSubmitting = false;
  newStandup: Partial<Standup> = { yesterday: '', today: '', blockers: '' };
  
  summary: string = '';
  isGeneratingSummary = false;

  private standupService = inject(StandupService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.setToday();
    this.loadData();
    
    // Pre-fill user name
    this.authService.userProfile$.subscribe(profile => {
      if (profile?.name) this.newStandup.user_name = profile.name;
    });
  }

  setToday() {
    this.selectedDate = new Date().toISOString().split('T')[0];
  }

  loadData() {
    this.standupService.getStandups().subscribe(data => {
      this.standups = data;
      this.filterByDate();
      
      // Auto-generate summary if we have data for today and no summary yet
      if (this.isToday() && this.filteredStandups.length > 0 && !this.summary) {
        this.generateSummary();
      }
    });
  }

  onDateChange(date: string) {
    this.selectedDate = date;
    this.filterByDate();
    this.summary = ''; // Clear summary on date change
  }

  filterByDate() {
    if (!this.selectedDate) return;
    this.filteredStandups = this.standups.filter(s => {
      if (!s.created_at) return false;
      return s.created_at.startsWith(this.selectedDate);
    });
  }

  isToday(): boolean {
    return this.selectedDate === new Date().toISOString().split('T')[0];
  }

  togglePostForm() {
    this.showPostForm = !this.showPostForm;
  }

  submitStandup() {
    if (!this.newStandup.yesterday || !this.newStandup.today) {
      alert('Please fill in Yesterday and Today');
      return;
    }

    this.isSubmitting = true;
    // Ensure user_name is set
    if (!this.newStandup.user_name) {
       const user = this.authService.currentUserValue;
       this.newStandup.user_name = (user as any)?.user_metadata?.name || user?.email?.split('@')[0] || 'Unknown';
    }

    this.standupService.postStandup(this.newStandup).subscribe({
      next: (res) => {
        this.standups.unshift(res);
        this.filterByDate();
        this.isSubmitting = false;
        this.showPostForm = false;
        this.newStandup = { user_name: this.newStandup.user_name, yesterday: '', today: '', blockers: '' };
        
        // Regenerate summary
        if (this.isToday()) this.generateSummary();
      },
      error: () => {
        alert('Failed to post standup');
        this.isSubmitting = false;
      }
    });
  }

  generateSummary() {
    this.isGeneratingSummary = true;
    this.standupService.generateSummary(this.selectedDate).subscribe({
      next: (res) => {
        this.summary = res.summary;
        this.isGeneratingSummary = false;
      },
      error: () => {
        this.isGeneratingSummary = false;
      }
    });
  }

  postToSlack() {
    if (!this.summary) return;
    
    this.standupService.postToSlack(this.summary).subscribe({
      next: () => alert('Posted to Slack!'),
      error: () => alert('Failed to post to Slack')
    });
  }
}
