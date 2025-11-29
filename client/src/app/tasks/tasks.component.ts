import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StandupService } from '../standup.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.component.html',
})
export class TasksComponent implements OnInit {
  tasks: any[] = [];
  isLoading = true;
  showAllTasks = false;
  selectedTask: any = null;

  private standupService = inject(StandupService);
  public authService = inject(AuthService);

  ngOnInit() {
    this.loadTasks();
  }

  openTaskDetail(task: any) {
    this.selectedTask = task;
  }

  closeTaskDetail() {
    this.selectedTask = null;
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

  getPriorityBadgeClass(priority: string): string {
    if (!priority) return 'bg-slate-700 text-slate-300';
    const p = priority.toLowerCase();
    if (p === 'urgent') return 'bg-red-500/20 text-red-400 border border-red-500/30';
    if (p === 'high') return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    if (p === 'normal') return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    if (p === 'low') return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    return 'bg-slate-700 text-slate-300';
  }

  isOverdue(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date(parseInt(dateStr)).getTime() < new Date().getTime();
  }
}
