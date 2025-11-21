import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StandupService } from '../standup.service';

@Component({
    selector: 'app-backlog',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-2xl font-bold text-slate-800">Backlog Grooming</h2>
        <button
          (click)="loadTasks()"
          class="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
        >
          Refresh List
        </button>
      </div>

      <div *ngIf="isLoading" class="text-center py-12">
        <div
          class="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"
        ></div>
        <p class="text-slate-500">Fetching tasks from ClickUp...</p>
      </div>

      <div *ngIf="!isLoading && tasks.length === 0" class="text-center py-12 bg-white rounded-xl border border-slate-200">
        <p class="text-slate-500">No tasks found in the configured list.</p>
      </div>

      <div class="space-y-6">
        <div
          *ngFor="let task of tasks"
          class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
        >
          <div class="flex justify-between items-start gap-4">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-mono"
                  >#{{ task.id }}</span
                >
                <h3 class="font-bold text-lg text-slate-800">{{ task.name }}</h3>
              </div>
              <p class="text-slate-600 text-sm line-clamp-2">
                {{ task.description || 'No description provided.' }}
              </p>
            </div>
            <button
              (click)="groom(task)"
              [disabled]="task.isGrooming"
              class="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-100 transition disabled:opacity-50 whitespace-nowrap"
            >
              {{ task.isGrooming ? 'Analyzing...' : '✨ AI Groom' }}
            </button>
          </div>

          <!-- AI Suggestion Box -->
          <div
            *ngIf="task.suggestion"
            class="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-top-2"
          >
            <h4 class="font-bold text-indigo-900 mb-3 flex items-center gap-2">
              🤖 AI Suggestions
            </h4>
            
            <div class="space-y-4 text-sm text-slate-700">
              <div *ngIf="task.suggestion.title">
                <span class="font-bold text-indigo-700 block text-xs uppercase">Better Title</span>
                {{ task.suggestion.title }}
              </div>
              
              <div *ngIf="task.suggestion.description">
                <span class="font-bold text-indigo-700 block text-xs uppercase">Improved Description</span>
                <p class="whitespace-pre-line">{{ task.suggestion.description }}</p>
              </div>

              <div *ngIf="task.suggestion.acceptance_criteria?.length">
                <span class="font-bold text-indigo-700 block text-xs uppercase">Acceptance Criteria</span>
                <ul class="list-disc pl-5 space-y-1 mt-1">
                  <li *ngFor="let ac of task.suggestion.acceptance_criteria">{{ ac }}</li>
                </ul>
              </div>

              <div *ngIf="task.suggestion.points">
                <span class="font-bold text-indigo-700 block text-xs uppercase">Est. Points</span>
                <span class="bg-indigo-600 text-white px-2 py-0.5 rounded text-xs font-bold">{{ task.suggestion.points }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BacklogComponent implements OnInit {
    tasks: any[] = [];
    isLoading = false;
    private standupService = inject(StandupService);

    ngOnInit() {
        this.loadTasks();
    }

    loadTasks() {
        this.isLoading = true;
        this.standupService.getBacklog().subscribe({
            next: (data) => {
                this.tasks = data.map(t => ({ ...t, isGrooming: false, suggestion: null }));
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }

    groom(task: any) {
        task.isGrooming = true;
        this.standupService.groomTask(task).subscribe({
            next: (suggestion) => {
                task.suggestion = suggestion;
                task.isGrooming = false;
            },
            error: (err) => {
                console.error(err);
                task.isGrooming = false;
                alert('Failed to groom task. Check console.');
            }
        });
    }
}
