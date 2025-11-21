import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StandupService, Standup } from './standup.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  // Senior Note: We use `template` (backticks) instead of `templateUrl`
  // to avoid "Phantom File" issues during development.
  template: `
    <div class="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <header class="mb-8 flex items-center gap-3">
          <div
            class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl"
          >
            S
          </div>
          <div>
            <h1 class="text-2xl font-bold">ScrumSage AI</h1>
            <p class="text-sm text-slate-500">Powered by Gemini</p>
          </div>
        </header>

        <!-- AI Summary Card -->
        <div
          class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg mb-8 transition-all"
        >
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-bold text-lg flex items-center gap-2">
              ✨ AI Insight
            </h2>
            <button
              (click)="getAiSummary()"
              [disabled]="isLoading"
              class="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? 'Thinking...' : 'Generate Report' }}
            </button>
          </div>

          <!-- AI Output Area -->
          <div
            *ngIf="summary"
            class="bg-white/10 p-4 rounded-lg backdrop-blur-sm text-sm leading-relaxed whitespace-pre-line animate-in fade-in duration-500"
          >
            {{ summary }}
          </div>
          <div *ngIf="!summary" class="text-indigo-100 text-sm italic">
            Click the button to generate a Team Lead summary of today's updates.
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column: Input Form -->
          <div class="lg:col-span-1">
            <div
              class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-8"
            >
              <h2 class="font-bold text-lg mb-4 text-slate-700">My Update</h2>
              <div class="space-y-4">
                <div>
                  <label class="text-xs font-bold text-slate-400 uppercase"
                    >Who are you?</label
                  >
                  <input
                    [(ngModel)]="user_name"
                    placeholder="e.g. Alice"
                    class="border border-slate-300 p-2 rounded w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label class="text-xs font-bold text-slate-400 uppercase"
                    >Yesterday</label
                  >
                  <textarea
                    [(ngModel)]="yesterday"
                    placeholder="What did you finish?"
                    class="border border-slate-300 p-2 rounded w-full h-20 focus:ring-2 focus:ring-indigo-500 outline-none"
                  ></textarea>
                </div>

                <div>
                  <label class="text-xs font-bold text-slate-400 uppercase"
                    >Today</label
                  >
                  <textarea
                    [(ngModel)]="today"
                    placeholder="What are you doing?"
                    class="border border-slate-300 p-2 rounded w-full h-20 focus:ring-2 focus:ring-indigo-500 outline-none"
                  ></textarea>
                </div>

                <div>
                  <label class="text-xs font-bold text-red-400 uppercase"
                    >Blockers</label
                  >
                  <input
                    [(ngModel)]="blockers"
                    placeholder="Any issues?"
                    class="border border-red-200 bg-red-50 p-2 rounded w-full focus:ring-2 focus:ring-red-500 outline-none placeholder-red-300"
                  />
                </div>

                <button
                  (click)="submit()"
                  class="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
                >
                  Post Update
                </button>
              </div>
            </div>
          </div>

          <!-- Right Column: The Feed -->
          <div class="lg:col-span-2 space-y-4">
            <h3 class="font-bold text-slate-700 flex items-center gap-2">
              Team Feed
              <span
                class="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs"
                >{{ standups.length }}</span
              >
            </h3>

            <!-- Empty State -->
            <div
              *ngIf="standups.length === 0"
              class="text-center py-12 text-slate-400"
            >
              <p>No updates yet. Be the first!</p>
            </div>

            <!-- Feed Items -->
            <div
              *ngFor="let update of standups"
              class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                class="flex justify-between items-start mb-3 border-b border-slate-50 pb-2"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold"
                  >
                    {{ update.user_name.charAt(0) | uppercase }}
                  </div>
                  <span class="font-bold text-slate-800">{{
                    update.user_name
                  }}</span>
                </div>
                <span
                  class="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded"
                >
                  {{ update.created_at | date : 'shortTime' }}
                </span>
              </div>

              <div class="space-y-3 text-sm">
                <div class="grid grid-cols-[80px_1fr]">
                  <span class="font-bold text-slate-400 text-xs uppercase pt-1"
                    >Done</span
                  >
                  <p class="text-slate-700">{{ update.yesterday }}</p>
                </div>
                <div class="grid grid-cols-[80px_1fr]">
                  <span class="font-bold text-indigo-500 text-xs uppercase pt-1"
                    >Doing</span
                  >
                  <p class="text-slate-800 font-medium">{{ update.today }}</p>
                </div>
                <div
                  *ngIf="update.blockers && update.blockers !== 'None'"
                  class="grid grid-cols-[80px_1fr] bg-red-50 p-2 rounded"
                >
                  <span class="font-bold text-red-500 text-xs uppercase pt-1"
                    >Blocked</span
                  >
                  <p class="text-red-700">{{ update.blockers }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AppComponent implements OnInit {
  standups: Standup[] = [];
  summary = '';
  isLoading = false;

  // Form Inputs
  user_name = '';
  yesterday = '';
  today = '';
  blockers = '';

  private standupService = inject(StandupService);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.standupService.getStandups().subscribe((data) => {
      this.standups = data;
    });
  }

  submit() {
    if (!this.user_name || !this.yesterday || !this.today) {
      alert('Please fill in the required fields!');
      return;
    }

    const newEntry: Partial<Standup> = {
      user_name: this.user_name,
      yesterday: this.yesterday,
      today: this.today,
      blockers: this.blockers || 'None',
    };

    this.standupService.postStandup(newEntry).subscribe(() => {
      this.loadData(); // Refresh list
      // Reset form (keep name)
      this.yesterday = '';
      this.today = '';
      this.blockers = '';
    });
  }

  getAiSummary() {
    this.isLoading = true;
    this.standupService.generateSummary().subscribe({
      next: (res) => {
        this.summary = res.summary;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.summary =
          '⚠️ Failed to generate summary. Check backend console for details.';
        this.isLoading = false;
      },
    });
  }
}
