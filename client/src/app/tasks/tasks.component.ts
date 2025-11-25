import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StandupService } from '../standup.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold text-slate-900 tracking-tight">
            {{ showAllTasks ? 'Team Tasks' : 'My Tasks' }}
          </h2>
          <p class="text-slate-500 mt-1">Synced from ClickUp • {{ tasks.length }} active tasks</p>
        </div>
        
        <!-- Controls -->
        <div class="flex items-center gap-3">
           <!-- Admin Toggle -->
           <button *ngIf="(authService.userRole$ | async) === 'admin'" 
                   (click)="toggleView()"
                   class="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
                   [class.bg-slate-900]="showAllTasks"
                   [class.text-white]="showAllTasks"
                   [class.border-slate-900]="showAllTasks"
                   [class.bg-white]="!showAllTasks"
                   [class.text-slate-700]="!showAllTasks"
                   [class.border-slate-200]="!showAllTasks">
             {{ showAllTasks ? 'View My Tasks' : 'View Team Tasks' }}
           </button>

           <div class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shadow-sm">
             Sorted by Due Date
           </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let i of [1,2,3,4,5,6]" class="h-48 bg-white rounded-xl border border-slate-200 animate-pulse"></div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && tasks.length === 0" class="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
        <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-slate-900">All caught up!</h3>
        <p class="text-slate-500">No tasks found.</p>
      </div>

      <!-- Tasks Grid -->
      <div *ngIf="!isLoading && tasks.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let task of tasks" 
             class="group bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 relative overflow-hidden">
          
          <!-- Status Line (Left Border) -->
          <div [class]="'absolute left-0 top-0 bottom-0 w-1 ' + getStatusColor(task.status.status, true)"></div>

          <div class="flex justify-between items-start mb-4 pl-2">
             <span class="text-xs font-mono text-slate-400">#{{ task.id }}</span>
             <span class="text-xs font-mono text-slate-400">#{{ task.id }}</span>
             <div class="relative" (click)="$event.stopPropagation()">
               <select 
                 [ngModel]="task.status.status" 
                 (ngModelChange)="updateStatus(task, $event)"
                 class="appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                 [ngClass]="getStatusColor(task.status.status)">
                 <option value="to do" class="bg-white text-slate-900">To Do</option>
                 <option value="in progress" class="bg-white text-slate-900">In Progress</option>
                 <option value="review" class="bg-white text-slate-900">Review</option>
                 <option value="complete" class="bg-white text-slate-900">Complete</option>
               </select>
               <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                 <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                 </svg>
               </div>
             </div>
          </div>

          <h3 class="text-lg font-semibold text-slate-900 mb-3 pl-2 group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[3.5rem]">
            {{ task.name }}
          </h3>

          <div class="pl-2 space-y-3">
            <!-- Assignees (Only show in Team View) -->
            <div *ngIf="showAllTasks && task.assignees?.length > 0" class="flex items-center gap-2 mb-2">
                <div class="flex -space-x-2 overflow-hidden">
                    <div *ngFor="let assignee of task.assignees" 
                         class="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600"
                         [title]="assignee.username">
                        {{ assignee.username?.charAt(0) | uppercase }}
                    </div>
                </div>
                <span class="text-xs text-slate-500">{{ task.assignees[0].username }}</span>
            </div>

            <!-- Priority -->
            <div class="flex items-center gap-2 text-sm">
              <div [class]="'w-2 h-2 rounded-full ' + getPriorityColor(task.priority?.priority)"></div>
              <span class="text-slate-600 font-medium">
                {{ (task.priority?.priority | titlecase) || 'Normal Priority' }}
              </span>
            </div>

            <!-- Due Date -->
            <div class="flex items-center gap-2 text-sm text-slate-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span [class.text-red-600]="isOverdue(task.due_date)">
                {{ task.due_date ? (task.due_date | date:'mediumDate') : 'No Due Date' }}
              </span>
            </div>
          </div>

          <!-- Action / Footer -->
          <div class="mt-6 pt-4 border-t border-slate-100 flex justify-end pl-2">
             <a [href]="task.url" target="_blank" class="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
               Open in ClickUp
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
               </svg>
             </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TasksComponent implements OnInit {
  tasks: any[] = [];
  isLoading = true;
  showAllTasks = false;

  private standupService = inject(StandupService);
  public authService = inject(AuthService);

  ngOnInit() {
    this.loadTasks();
  }

  updateStatus(task: any, newStatus: string) {
    const oldStatus = task.status.status;
    // Optimistic update
    task.status.status = newStatus;
    
    this.standupService.updateTaskStatus(task.id, newStatus).subscribe({
      next: () => {
        console.log(`Task ${task.id} updated to ${newStatus}`);
      },
      error: (err) => {
        console.error('Failed to update task status', err);
        // Revert on error
        task.status.status = oldStatus;
        alert('Failed to update status');
      }
    });
  }

  toggleView() {
    this.showAllTasks = !this.showAllTasks;
    this.loadTasks();
  }

  loadTasks() {
    this.isLoading = true;
    this.standupService.getTasks(this.showAllTasks).subscribe({
      next: (data) => {
        // Sort by due date (nulls last)
        this.tasks = data.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return parseInt(a.due_date) - parseInt(b.due_date);
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load tasks', err);
        this.isLoading = false;
      }
    });
  }

  getStatusColor(status: string, isBorder: boolean = false): string {
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('done')) {
      return isBorder ? 'bg-emerald-500' : 'bg-emerald-100 text-emerald-800';
    }
    if (s.includes('progress') || s.includes('doing')) {
      return isBorder ? 'bg-blue-500' : 'bg-blue-100 text-blue-800';
    }
    if (s.includes('review')) {
      return isBorder ? 'bg-amber-500' : 'bg-amber-100 text-amber-800';
    }
    return isBorder ? 'bg-slate-300' : 'bg-slate-100 text-slate-800';
  }

  getPriorityColor(priority: string): string {
    if (!priority) return 'bg-blue-400'; // Default normal
    const p = priority.toLowerCase();
    if (p === 'urgent') return 'bg-red-500 shadow-sm shadow-red-200';
    if (p === 'high') return 'bg-orange-500';
    if (p === 'normal') return 'bg-blue-400';
    if (p === 'low') return 'bg-slate-400';
    return 'bg-slate-300';
  }

  isOverdue(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date(parseInt(dateStr)).getTime() < new Date().getTime();
  }
}
