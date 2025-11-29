import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StandupService } from '../standup.service';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-[calc(100vh-6rem)] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Backlog Grooming</h1>
          <p class="text-slate-500">Refine and prioritize tasks for the next sprint</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
            {{ tasks.length }} Items
          </div>
        </div>
      </div>

      <div class="flex-1 flex gap-6 overflow-hidden">
        <!-- Task List -->
        <div class="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 class="font-semibold text-slate-700">Backlog Items</h3>
            <button (click)="loadTasks()" class="text-slate-400 hover:text-indigo-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <div class="overflow-y-auto flex-1 p-2 space-y-2">
            <div *ngIf="isLoading" class="p-8 text-center text-slate-400">Loading tasks...</div>
            
            <div *ngFor="let task of tasks" 
              (click)="selectTask(task)"
              [class.bg-indigo-50]="selectedTask?.id === task.id"
              [class.border-indigo-200]="selectedTask?.id === task.id"
              class="group p-4 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
              <div class="flex items-start justify-between">
                <div class="flex items-start gap-3">
                  <div class="mt-1 w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-400"></div>
                  <div>
                    <h4 class="font-medium text-slate-900 line-clamp-1">{{ task.name }}</h4>
                    <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ task.description || 'No description' }}</p>
                  </div>
                </div>
                <div *ngIf="task.analysis" class="flex items-center gap-1 text-xs font-medium" 
                  [ngClass]="getScoreColor(task.analysis.score)">
                  <span>{{ task.analysis.score }}/10</span>
                </div>
              </div>
            </div>

            <div *ngIf="!isLoading && tasks.length === 0" class="p-8 text-center text-slate-500">
              No backlog items found.
            </div>
          </div>
        </div>

        <!-- Detail Panel -->
        <div *ngIf="selectedTask" class="w-96 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden animate-slide-in-right">
          <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 class="font-semibold text-slate-700">Task Analysis</h3>
            <button (click)="selectedTask = null" class="text-slate-400 hover:text-slate-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h2 class="text-lg font-bold text-slate-900">{{ selectedTask.name }}</h2>
              <div class="mt-2 flex items-center gap-2">
                <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium uppercase">{{ selectedTask.status?.status }}</span>
                <span *ngIf="selectedTask.priority" class="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium uppercase">{{ selectedTask.priority.priority }}</span>
              </div>
            </div>

            <div class="prose prose-sm text-slate-600">
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
              <p class="whitespace-pre-wrap">{{ selectedTask.description || 'No description provided.' }}</p>
            </div>

            <!-- AI Analysis Section -->
            <div class="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-semibold text-indigo-900 flex items-center gap-2">
                  <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Insight
                </h4>
                <button 
                  (click)="analyzeTask(selectedTask)" 
                  [disabled]="isAnalyzing"
                  class="text-xs bg-white border border-indigo-200 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 disabled:opacity-50">
                  {{ isAnalyzing ? 'Analyzing...' : 'Analyze' }}
                </button>
              </div>

              <div *ngIf="selectedTask.analysis" class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-indigo-700">Clarity Score</span>
                  <div class="flex items-center gap-2">
                    <div class="h-2 w-24 bg-indigo-200 rounded-full overflow-hidden">
                      <div class="h-full bg-indigo-600 rounded-full" [style.width.%]="selectedTask.analysis.score * 10"></div>
                    </div>
                    <span class="text-sm font-bold text-indigo-900">{{ selectedTask.analysis.score }}/10</span>
                  </div>
                </div>

                <div class="bg-white/60 rounded-lg p-3 border border-indigo-100">
                  <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Suggestion</span>
                  <p class="text-sm text-indigo-900 mt-1">{{ selectedTask.analysis.suggestion }}</p>
                </div>

                <div class="text-xs text-indigo-700 italic">
                  "{{ selectedTask.analysis.reasoning }}"
                </div>
              </div>

              <div *ngIf="!selectedTask.analysis && !isAnalyzing" class="text-center py-4 text-indigo-400 text-sm">
                Click analyze to get AI insights on this task.
              </div>
            </div>
          </div>
        </div>
        
        <div *ngIf="!selectedTask" class="w-96 bg-slate-50 rounded-xl border border-slate-200 border-dashed flex items-center justify-center text-slate-400">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>Select a task to view details</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-slide-in-right {
      animation: slideInRight 0.3s ease-out;
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class BacklogComponent implements OnInit {
  tasks: any[] = [];
  selectedTask: any = null;
  isLoading = false;
  isAnalyzing = false;
  
  private standupService = inject(StandupService);

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.isLoading = true;
    this.standupService.getBacklog().subscribe({
      next: (data) => {
        this.tasks = data.map(t => ({ ...t, analysis: null }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  selectTask(task: any) {
    this.selectedTask = task;
  }

  analyzeTask(task: any) {
    this.isAnalyzing = true;
    this.standupService.analyzeBacklogItem(task.id, task.name, task.description || '').subscribe({
      next: (analysis) => {
        task.analysis = analysis;
        this.isAnalyzing = false;
      },
      error: (err) => {
        console.error(err);
        alert('Analysis failed');
        this.isAnalyzing = false;
      }
    });
  }

  getScoreColor(score: number): string {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 5) return 'text-amber-600';
    return 'text-red-600';
  }
}
