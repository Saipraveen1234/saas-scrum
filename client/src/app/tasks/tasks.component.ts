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
    <div class="h-full flex flex-col bg-white">
      <!-- Header -->
      <div class="h-14 border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 bg-white">
        <div class="flex items-center gap-2 text-sm">
          <span class="text-slate-500">Team Space</span>
          <span class="text-slate-300">/</span>
          <span class="font-semibold text-slate-900 flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {{ showAllTasks ? 'Team Tasks' : 'My Tasks' }}
          </span>
        </div>

        <div class="flex items-center gap-3">
          <button *ngIf="(authService.userRole$ | async) === 'admin'" 
                  (click)="toggleView()"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors border bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700">
             {{ showAllTasks ? 'View My Tasks' : 'View Team Tasks' }}
          </button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="h-12 border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0 overflow-x-auto">
        <div class="flex items-center gap-2">
           <button class="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-100 text-xs font-medium text-slate-600 transition-colors">
             <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
             </svg>
             Filter
           </button>
           <button class="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-100 text-xs font-medium text-slate-600 transition-colors">
             <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
             </svg>
             Assignee
           </button>
        </div>
        <div class="h-4 w-px bg-slate-200"></div>
        <div class="relative flex-1 max-w-xs">
          <svg class="absolute left-2.5 top-1.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search tasks..." class="w-full pl-9 pr-4 py-1.5 bg-transparent text-sm border-none focus:ring-0 placeholder-slate-400">
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 bg-slate-50">
        
        <div *ngIf="isLoading" class="space-y-4">
           <div *ngFor="let i of [1,2,3]" class="h-32 bg-white rounded-lg border border-slate-200 animate-pulse"></div>
        </div>

        <div *ngIf="!isLoading && groupedTasks.length === 0" class="text-center py-20">
          <p class="text-slate-500">No tasks found.</p>
        </div>

        <div *ngIf="!isLoading" class="space-y-8 pb-20">
          <div *ngFor="let group of groupedTasks" class="space-y-1">
            
            <!-- Group Header -->
            <div class="flex items-center gap-2 px-4 py-2 sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10">
              <button class="p-0.5 hover:bg-slate-200 rounded text-slate-400 transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <span [class]="'text-xs font-bold uppercase tracking-wider ' + group.textColor">
                {{ group.status }}
              </span>
              <span class="px-1.5 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">{{ group.tasks.length }}</span>
            </div>

            <!-- Tasks Table -->
            <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <!-- Table Header -->
              <div class="grid grid-cols-[1fr_150px_150px_150px_40px] gap-4 px-4 py-2 border-b border-slate-100 bg-white text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                <div class="pl-8">Name</div>
                <div>Assignee</div>
                <div>Due date</div>
                <div>Priority</div>
                <div></div>
              </div>

              <!-- Rows -->
              <div *ngFor="let task of group.tasks" 
                   (click)="openModal(task)"
                   class="group grid grid-cols-[1fr_150px_150px_150px_40px] gap-4 px-4 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 items-center transition-all cursor-pointer bg-white">
                
                <!-- Name -->
                <div class="flex items-center gap-3 min-w-0">
                  <div class="relative group/status">
                     <div [class]="'w-3.5 h-3.5 rounded-sm border cursor-pointer transition-colors flex items-center justify-center ' + getStatusColor(task.status.status, true)">
                       <svg *ngIf="task.status.status === 'closed' || task.status.status === 'completed'" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                       </svg>
                     </div>
                     
                     <!-- Quick Status Change Dropdown -->
                     <select 
                       [ngModel]="task.status.status" 
                       (ngModelChange)="updateStatus(task, $event)"
                       class="absolute inset-0 opacity-0 cursor-pointer">
                       <option value="open">Open</option>
                       <option value="pending">Pending</option>
                       <option value="in progress">In Progress</option>
                       <option value="completed">Completed</option>
                       <option value="backlog">Backlog</option>
                       <option value="closed">Closed</option>
                     </select>
                  </div>
                  <span class="text-sm text-slate-700 font-medium truncate group-hover:text-indigo-600 transition-colors cursor-pointer" [title]="task.name">
                    {{ task.name }}
                  </span>
                </div>

                <!-- Assignee -->
                <div class="flex items-center">
                  <div *ngIf="task.assignees?.length > 0" class="flex -space-x-2">
                    <div *ngFor="let assignee of task.assignees" 
                         class="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700"
                         [title]="assignee.username">
                      {{ assignee.username?.charAt(0) | uppercase }}
                    </div>
                  </div>
                  <div *ngIf="!task.assignees?.length" class="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                <!-- Due Date -->
                <div class="text-xs text-slate-500 flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span [class.text-red-600]="isOverdue(task.due_date)">
                    {{ task.due_date ? (task.due_date | date:'MMM d') : '-' }}
                  </span>
                </div>

                <!-- Priority -->
                <div class="flex items-center gap-2">
                  <div [class]="'w-2 h-2 rounded-full ' + getPriorityColor(task.priority?.priority)"></div>
                  <span class="text-xs text-slate-600 capitalize">{{ task.priority?.priority || 'Normal' }}</span>
                </div>

                <!-- Actions -->
                <div class="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                   <a [href]="task.url" target="_blank" class="text-slate-400 hover:text-indigo-600">
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                     </svg>
                   </a>
                </div>

              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Task Details Modal -->
    <div *ngIf="selectedTask" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" (click)="closeModal()">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"></div>
      
      <div class="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" (click)="$event.stopPropagation()">
        
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div class="flex items-center gap-3">
            <span class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-600">
              TASK-{{ selectedTask.id }}
            </span>
            <div class="h-4 w-px bg-slate-300"></div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-500">Status:</span>
              <select 
                [ngModel]="selectedTask.status.status" 
                (ngModelChange)="updateStatus(selectedTask, $event)"
                class="text-sm font-semibold bg-transparent border-none focus:ring-0 cursor-pointer uppercase"
                [ngClass]="getStatusColor(selectedTask.status.status)">
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="backlog">Backlog</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          
          <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="flex-1 overflow-y-auto flex flex-col md:flex-row">
          
          <!-- Main Content -->
          <div class="flex-1 p-6 space-y-8 border-r border-slate-200">
            <!-- Title -->
            <div>
              <input 
                type="text" 
                [(ngModel)]="selectedTask.name" 
                class="w-full text-2xl font-bold text-slate-900 border-none focus:ring-0 p-0 placeholder-slate-400 bg-transparent"
                placeholder="Task Name">
            </div>

            <!-- Description -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </h3>
                <button 
                  (click)="generateDescription()"
                  [disabled]="isAiLoading"
                  class="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {{ isAiLoading ? 'Generating...' : 'Write with AI' }}
                </button>
              </div>
              
              <textarea 
                [(ngModel)]="selectedTask.description" 
                rows="8"
                class="w-full rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm text-slate-700 placeholder-slate-400"
                placeholder="Add a more detailed description..."></textarea>
            </div>

            <!-- Subtasks (Placeholder) -->
            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-slate-900">Subtasks</h3>
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-slate-500 text-sm italic">
                  No subtasks yet.
                </div>
                <button class="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add subtask
                </button>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="w-full md:w-80 bg-slate-50/50 p-6 space-y-6">
            
            <!-- Properties -->
            <div class="space-y-4">
              <!-- Assignees -->
              <div class="space-y-1">
                <label class="text-xs font-medium text-slate-500 uppercase tracking-wider">Assignees</label>
                <div class="flex flex-wrap gap-2">
                  <div *ngFor="let assignee of selectedTask.assignees" 
                       class="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
                    <div class="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                      {{ assignee.username?.charAt(0) | uppercase }}
                    </div>
                    <span class="text-xs font-medium text-slate-700">{{ assignee.username }}</span>
                  </div>
                  <button class="w-7 h-7 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Due Date -->
              <div class="space-y-1">
                <label class="text-xs font-medium text-slate-500 uppercase tracking-wider">Due Date</label>
                <div class="flex items-center gap-2 text-sm text-slate-700">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ selectedTask.due_date ? (selectedTask.due_date | date:'mediumDate') : 'No due date' }}
                </div>
              </div>

              <!-- Priority -->
              <div class="space-y-1">
                <label class="text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</label>
                <div class="flex items-center gap-2">
                  <div [class]="'w-2 h-2 rounded-full ' + getPriorityColor(selectedTask.priority?.priority)"></div>
                  <span class="text-sm font-medium text-slate-700 capitalize">{{ selectedTask.priority?.priority || 'Normal' }}</span>
                </div>
              </div>
            </div>

            <hr class="border-slate-200">

            <!-- AI Estimation -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <svg class="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Time Estimate
                </label>
                <button 
                  (click)="estimateTime()"
                  [disabled]="isAiLoading"
                  class="text-xs text-indigo-600 hover:underline disabled:opacity-50">
                  Calculate
                </button>
              </div>
              
              <div *ngIf="timeEstimate" class="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                <div class="text-lg font-bold text-indigo-700">{{ timeEstimate.estimate }}</div>
                <p class="text-xs text-indigo-600 mt-1">{{ timeEstimate.reasoning }}</p>
              </div>
              
              <div *ngIf="!timeEstimate" class="text-sm text-slate-400 italic">
                Click calculate to get an AI estimate.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class TasksComponent implements OnInit {
  tasks: any[] = [];
  groupedTasks: { status: string, tasks: any[], textColor: string }[] = [];
  isLoading = true;
  showAllTasks = false;
  
  // Modal State
  selectedTask: any = null;
  isAiLoading = false;
  timeEstimate: { estimate: string, reasoning: string } | null = null;

  private standupService = inject(StandupService);
  public authService = inject(AuthService);

  ngOnInit() {
    this.loadTasks();
  }

  groupTasks() {
    const groups: { [key: string]: any[] } = {};
    const statusOrder = ['open', 'pending', 'in progress', 'completed', 'backlog', 'closed'];
    
    // Initialize groups
    statusOrder.forEach(s => groups[s] = []);
    
    // Distribute tasks
    this.tasks.forEach(task => {
      const status = task.status.status.toLowerCase();
      if (groups[status]) {
        groups[status].push(task);
      } else {
        // Handle unknown statuses
        if (!groups['other']) groups['other'] = [];
        groups['other'].push(task);
      }
    });

    // Create array for template
    this.groupedTasks = Object.keys(groups).map(status => ({
      status: status,
      tasks: groups[status],
      textColor: this.getStatusTextColor(status)
    })).filter(g => g.tasks.length > 0 || statusOrder.includes(g.status)); // Keep main statuses even if empty
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
        this.groupTasks(); // Re-group to revert UI
        alert('Failed to update status');
      }
    });
    
    // Re-group immediately for UI update
    this.groupTasks();
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
        
        this.groupTasks();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load tasks', err);
        this.isLoading = false;
      }
    });
  }

  getStatusColor(status: string, isSquare: boolean = false): string {
    const s = status.toLowerCase();
    if (s === 'closed') {
      return isSquare ? 'bg-emerald-500 border-emerald-500' : 'bg-emerald-100 text-emerald-800';
    }
    if (s === 'completed') {
      return isSquare ? 'bg-emerald-400 border-emerald-400' : 'bg-emerald-50 text-emerald-600';
    }
    if (s === 'in progress') {
      return isSquare ? 'bg-blue-500 border-blue-500' : 'bg-blue-100 text-blue-800';
    }
    if (s === 'pending') {
      return isSquare ? 'bg-amber-500 border-amber-500' : 'bg-amber-100 text-amber-800';
    }
    if (s === 'backlog') {
      return isSquare ? 'bg-slate-500 border-slate-500' : 'bg-slate-200 text-slate-700';
    }
    // Open / Default
    return isSquare ? 'border-slate-300 hover:border-slate-400' : 'bg-slate-100 text-slate-800';
  }

  getStatusTextColor(status: string): string {
    const s = status.toLowerCase();
    if (s === 'closed') return 'text-emerald-600';
    if (s === 'completed') return 'text-emerald-500';
    if (s === 'in progress') return 'text-blue-600';
    if (s === 'pending') return 'text-amber-600';
    if (s === 'backlog') return 'text-slate-600';
    return 'text-slate-500';
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

  // --- Modal & AI Methods ---

  openModal(task: any) {
    this.selectedTask = { ...task }; // Clone to avoid direct mutation until saved
    this.timeEstimate = null;
  }

  closeModal() {
    this.selectedTask = null;
    this.timeEstimate = null;
  }

  generateDescription() {
    if (!this.selectedTask) return;
    
    this.isAiLoading = true;
    this.standupService.generateDescription(this.selectedTask.name, 'Development Task').subscribe({
      next: (res) => {
        this.selectedTask.description = res.description;
        this.isAiLoading = false;
      },
      error: (err) => {
        console.error('Failed to generate description', err);
        alert('AI generation failed');
        this.isAiLoading = false;
      }
    });
  }

  estimateTime() {
    if (!this.selectedTask) return;

    this.isAiLoading = true;
    this.standupService.estimateTime(this.selectedTask.name, this.selectedTask.description || '').subscribe({
      next: (res) => {
        this.timeEstimate = res;
        this.isAiLoading = false;
      },
      error: (err) => {
        console.error('Failed to estimate time', err);
        alert('AI estimation failed');
        this.isAiLoading = false;
      }
    });
  }

  isOverdue(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date(parseInt(dateStr)).getTime() < new Date().getTime();
  }
}
