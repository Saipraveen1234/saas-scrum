import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StandupService } from '../standup.service';

@Component({
  selector: 'app-sprint-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-[calc(100vh-6rem)] flex flex-col space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Sprint Planning</h1>
          <p class="text-slate-500">Plan and commit to the next sprint</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-xs text-slate-500 uppercase font-bold">Capacity</p>
            <div class="flex items-center gap-2">
              <div class="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-600 rounded-full transition-all duration-500" [style.width.%]="(totalPoints / capacity) * 100"></div>
              </div>
              <span class="text-sm font-bold text-slate-900">{{ totalPoints }} / {{ capacity }} pts</span>
            </div>
          </div>
          <button 
            (click)="startSprint()" 
            [disabled]="sprintTasks.length === 0 || isCommitting"
            class="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-sm hover:shadow transition-all">
            {{ isCommitting ? 'Starting...' : 'Start Sprint' }}
          </button>
        </div>
      </div>

      <!-- Sprint Goal Section -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div class="flex items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-slate-700 mb-2">Sprint Goal</label>
            <div class="flex gap-2">
              <input 
                type="text" 
                [(ngModel)]="sprintGoal" 
                class="flex-1 rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500" 
                placeholder="What is the main objective of this sprint?">
              <button 
                (click)="generateGoal()" 
                [disabled]="isGeneratingGoal || sprintTasks.length === 0"
                class="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 disabled:opacity-50 flex items-center gap-2 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {{ isGeneratingGoal ? 'Generating...' : 'Suggest Goal' }}
              </button>
            </div>
          </div>
          <div class="w-48">
             <label class="block text-sm font-medium text-slate-700 mb-2">Sprint Name</label>
             <input type="text" [(ngModel)]="sprintName" class="w-full rounded-lg border-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
          </div>
        </div>
      </div>

      <!-- Drag & Drop Area (Simulated with buttons) -->
      <div class="flex-1 flex gap-6 overflow-hidden">
        <!-- Backlog Column -->
        <div class="flex-1 flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
          <div class="p-4 border-b border-slate-200 bg-slate-100 flex justify-between items-center">
            <h3 class="font-semibold text-slate-700">Backlog</h3>
            <span class="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{{ backlogTasks.length }}</span>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <div *ngFor="let task of backlogTasks" class="bg-white p-4 rounded-lg shadow-sm border border-slate-200 group hover:border-indigo-300 transition-colors">
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-medium text-slate-900">{{ task.name }}</h4>
                  <div class="flex items-center gap-2 mt-2">
                    <span class="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">{{ task.status?.status }}</span>
                    <span *ngIf="task.priority" class="text-xs px-2 py-1 bg-red-50 text-red-600 rounded">{{ task.priority.priority }}</span>
                  </div>
                </div>
                <button (click)="moveToSprint(task)" class="text-slate-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-50">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
            <div *ngIf="backlogTasks.length === 0" class="text-center py-8 text-slate-400 text-sm">
              No items in backlog.
            </div>
          </div>
        </div>

        <!-- Sprint Column -->
        <div class="flex-1 flex flex-col bg-indigo-50/50 rounded-xl border border-indigo-100 overflow-hidden">
          <div class="p-4 border-b border-indigo-100 bg-indigo-50 flex justify-between items-center">
            <h3 class="font-semibold text-indigo-900">Sprint Candidates</h3>
            <span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">{{ sprintTasks.length }}</span>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <div *ngFor="let task of sprintTasks" class="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 group hover:border-indigo-300 transition-colors">
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-medium text-indigo-900">{{ task.name }}</h4>
                  <div class="flex items-center gap-2 mt-2">
                    <span class="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded font-medium">Sprint Ready</span>
                    <span class="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">Est: {{ getEstimate(task) }}</span>
                  </div>
                </div>
                <button (click)="moveToBacklog(task)" class="text-slate-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </div>
            </div>
             <div *ngIf="sprintTasks.length === 0" class="text-center py-8 text-indigo-300 text-sm border-2 border-dashed border-indigo-100 rounded-lg m-4">
              Drag items here or click arrow to add to sprint.
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SprintPlanningComponent implements OnInit {
  backlogTasks: any[] = [];
  sprintTasks: any[] = [];
  
  sprintName = 'Sprint ' + this.getWeekNumber(new Date());
  sprintGoal = '';
  
  capacity = 40; // Hardcoded for now, could be dynamic
  totalPoints = 0;
  
  isGeneratingGoal = false;
  isCommitting = false;

  private standupService = inject(StandupService);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.standupService.getSprintPlanningData().subscribe({
      next: (data) => {
        this.backlogTasks = data.backlog;
        this.sprintTasks = data.nextSprint;
        this.calculatePoints();
      },
      error: (err) => console.error(err)
    });
  }

  moveToSprint(task: any) {
    this.backlogTasks = this.backlogTasks.filter(t => t.id !== task.id);
    this.sprintTasks.push(task);
    this.calculatePoints();
  }

  moveToBacklog(task: any) {
    this.sprintTasks = this.sprintTasks.filter(t => t.id !== task.id);
    this.backlogTasks.push(task);
    this.calculatePoints();
  }

  calculatePoints() {
    // Mock point calculation based on estimate or random if missing
    this.totalPoints = this.sprintTasks.reduce((acc, task) => {
      return acc + this.getEstimateValue(task);
    }, 0);
  }

  getEstimate(task: any): string {
    // Try to find estimate in custom fields or description
    // For now, return a mock string
    return '3 pts';
  }

  getEstimateValue(task: any): number {
    return 3; // Mock value
  }

  generateGoal() {
    this.isGeneratingGoal = true;
    this.standupService.generateSprintGoal(this.sprintTasks).subscribe({
      next: (res) => {
        this.sprintGoal = res.goal;
        this.isGeneratingGoal = false;
      },
      error: () => {
        alert('Failed to generate goal');
        this.isGeneratingGoal = false;
      }
    });
  }

  startSprint() {
    if (!this.sprintGoal) {
      alert('Please define a Sprint Goal');
      return;
    }

    this.isCommitting = true;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 14); // 2 weeks

    const sprintData = {
      name: this.sprintName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      goal: this.sprintGoal
    };

    this.standupService.commitSprint(sprintData).subscribe({
      next: () => {
        alert('Sprint Started Successfully!');
        this.isCommitting = false;
        // Ideally navigate to Dashboard or Active Sprint view
      },
      error: () => {
        alert('Failed to start sprint');
        this.isCommitting = false;
      }
    });
  }

  getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
