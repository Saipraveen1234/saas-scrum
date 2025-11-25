import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-sprint-planning',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="h-[calc(100vh-2rem)] flex flex-col space-y-6">
      <div class="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 class="text-3xl font-bold text-slate-900">Sprint Planning</h2>
          <p class="text-slate-500 mt-1">AI-powered backlog grooming and sprint creation</p>
        </div>
        <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                Step {{ currentStep }} of 4
            </span>
        </div>
      </div>

      <!-- STEP 1: BACKLOG REVIEW -->
      <div *ngIf="currentStep === 1" class="space-y-6 flex-1 overflow-y-auto">
        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold text-slate-900">1. Backlog Analysis</h3>
            <button (click)="analyzeBacklog()" [disabled]="isLoading"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {{ isLoading ? 'Analyzing...' : 'Analyze Backlog with AI' }}
            </button>
          </div>

          <div *ngIf="analyzedTasks.length > 0" class="space-y-4">
             <div *ngFor="let task of analyzedTasks" class="flex items-start gap-4 p-4 rounded-lg border"
                  [class.border-green-200]="task.ready" [class.bg-green-50]="task.ready"
                  [class.border-amber-200]="!task.ready" [class.bg-amber-50]="!task.ready">
                
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-mono text-xs text-slate-500">#{{ task.id }}</span>
                        <h4 class="font-medium text-slate-900">{{ task.name }}</h4>
                    </div>
                    <p class="text-sm text-slate-600 mb-2">{{ task.notes }}</p>
                    <div class="flex items-center gap-4 text-sm">
                        <span class="font-medium" [class.text-green-700]="task.ready" [class.text-amber-700]="!task.ready">
                            {{ task.ready ? '✓ Ready' : '⚠ Needs Info' }}
                        </span>
                        <span class="text-slate-500">
                            Est: <input type="number" [(ngModel)]="task.estimate" class="w-16 px-2 py-1 border rounded text-center bg-white"> pts
                        </span>
                    </div>
                </div>
             </div>
          </div>
          
          <div *ngIf="analyzedTasks.length > 0" class="mt-6 flex justify-end">
             <button (click)="nextStep()" class="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
                Next: Capacity
             </button>
          </div>
        </div>
      </div>

      <!-- STEP 2: CAPACITY -->
      <div *ngIf="currentStep === 2" class="max-w-xl mx-auto flex-1 flex flex-col justify-center">
        <div class="bg-white rounded-xl border border-slate-200 p-8 text-center">
           <h3 class="text-xl font-semibold text-slate-900 mb-6">2. Team Capacity</h3>
           
           <div class="grid grid-cols-2 gap-6 mb-8 text-left">
              <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Developers</label>
                  <input type="number" [(ngModel)]="capacityInputs.devs" class="w-full px-4 py-2 border rounded-lg">
              </div>
              <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Days in Sprint</label>
                  <input type="number" [(ngModel)]="capacityInputs.days" class="w-full px-4 py-2 border rounded-lg">
              </div>
              <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Holidays/Leave (Total Days)</label>
                  <input type="number" [(ngModel)]="capacityInputs.holidays" class="w-full px-4 py-2 border rounded-lg">
              </div>
              <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Velocity Factor (pts/day)</label>
                  <input type="number" [(ngModel)]="capacityInputs.velocity" class="w-full px-4 py-2 border rounded-lg">
              </div>
           </div>

           <div class="bg-indigo-50 rounded-lg p-4 mb-8">
               <p class="text-sm text-indigo-600 uppercase tracking-wide font-bold">Calculated Capacity</p>
               <p class="text-4xl font-bold text-indigo-900 mt-2">{{ calculateCapacity() }} <span class="text-lg font-normal text-indigo-600">points</span></p>
           </div>

           <button (click)="generateProposal()" [disabled]="isLoading"
                   class="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
              {{ isLoading ? 'Generating Plan...' : 'Generate Sprint Proposal' }}
           </button>
        </div>
      </div>

      <!-- STEP 3: PROPOSAL (Two-Panel Drag & Drop) -->
      <div *ngIf="currentStep === 3" class="flex-1 flex flex-col min-h-0">
        <!-- Goal & Capacity Header -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 mb-6 flex-shrink-0">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
                <div class="lg:col-span-2">
                    <label class="block text-sm font-medium text-slate-700 mb-2">Sprint Goal</label>
                    <input type="text" [(ngModel)]="proposal.sprintGoal" class="w-full px-4 py-2 border border-slate-300 rounded-lg font-medium text-lg focus:ring-indigo-500 focus:border-indigo-500">
                </div>
                <div>
                    <div class="flex justify-between text-sm font-medium mb-2">
                        <span>Capacity Used</span>
                        <span [class.text-red-600]="getSelectedPoints() > calculateCapacity()">{{ getSelectedPoints() }} / {{ calculateCapacity() }} pts</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div class="h-full transition-all duration-500" 
                             [class.bg-indigo-600]="getSelectedPoints() <= calculateCapacity()"
                             [class.bg-red-500]="getSelectedPoints() > calculateCapacity()"
                             [style.width.%]="getCapacityPercentage()"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Drag & Drop Panels -->
        <div class="flex-1 flex gap-6 min-h-0">
            <!-- Available Backlog -->
            <div class="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
                 (dragover)="onDragOver($event)" (drop)="onDrop($event, 'backlog')">
                <div class="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">
                    Available Backlog
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                    <div *ngFor="let task of getUnselectedTasks()" 
                         draggable="true" (dragstart)="onDragStart($event, task)" (dragend)="onDragEnd($event)"
                         class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-move hover:border-indigo-300 hover:shadow-md transition-all group">
                        <div class="flex justify-between items-start">
                            <span class="font-medium text-slate-900 group-hover:text-indigo-600">{{ task.name }}</span>
                            <span class="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 ml-2 whitespace-nowrap">{{ task.estimate }} pts</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-2 line-clamp-2">{{ task.notes }}</p>
                    </div>
                    <div *ngIf="getUnselectedTasks().length === 0" class="text-center py-8 text-slate-400 text-sm">
                        All tasks selected
                    </div>
                </div>
            </div>

            <!-- Sprint Backlog -->
            <div class="flex-1 bg-white rounded-xl border border-indigo-200 shadow-sm flex flex-col overflow-hidden"
                 (dragover)="onDragOver($event)" (drop)="onDrop($event, 'sprint')">
                <div class="p-4 border-b border-indigo-100 bg-indigo-50 font-bold text-indigo-900 flex justify-between">
                    <span>Sprint Backlog</span>
                    <span class="text-sm font-normal bg-white px-2 py-0.5 rounded border border-indigo-100">{{ proposal.selectedTaskIds.length }} Items</span>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-indigo-50/30">
                    <div *ngFor="let task of getSelectedTasks()" 
                         draggable="true" (dragstart)="onDragStart($event, task)" (dragend)="onDragEnd($event)"
                         class="bg-white p-4 rounded-lg border border-indigo-200 shadow-sm cursor-move hover:border-indigo-400 hover:shadow-md transition-all group">
                        <div class="flex justify-between items-start">
                            <span class="font-medium text-slate-900 group-hover:text-indigo-600">{{ task.name }}</span>
                            <span class="font-mono text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded ml-2 whitespace-nowrap">{{ task.estimate }} pts</span>
                        </div>
                    </div>
                    <div *ngIf="getSelectedTasks().length === 0" class="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg m-4">
                        Drag tasks here to add to sprint
                    </div>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex justify-end gap-4 flex-shrink-0">
            <button (click)="currentStep = 2" class="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">Back</button>
            <button (click)="startSprint()" [disabled]="isLoading"
                    class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm shadow-green-200 flex items-center gap-2">
                <svg *ngIf="isLoading" class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {{ isLoading ? 'Starting Sprint...' : 'Start Sprint' }}
            </button>
        </div>
      </div>

      <!-- STEP 4: SUCCESS -->
      <div *ngIf="currentStep === 4" class="text-center py-20 flex-1 flex flex-col justify-center">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
          </div>
          <h2 class="text-3xl font-bold text-slate-900 mb-2">Sprint Started Successfully!</h2>
          <p class="text-slate-600 mb-8">
              Created list <strong>"{{ sprintName }}"</strong> and moved {{ proposal.selectedTaskIds.length }} tasks.
          </p>
          <a href="/tasks" class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium inline-block">
              View Sprint Board
          </a>
      </div>

    </div>
  `
})
export class SprintPlanningComponent {
    currentStep = 1;
    isLoading = false;

    analyzedTasks: any[] = [];

    capacityInputs = {
        devs: 5,
        days: 10,
        holidays: 0,
        velocity: 0.8 // points per dev-day
    };

    proposal: any = {
        sprintGoal: '',
        selectedTaskIds: [],
        reasoning: ''
    };

    sprintName = `Sprint ${new Date().toISOString().split('T')[0]}`;

    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = 'http://localhost:3000/api';

    // Drag & Drop Helpers
    isDragging = false;
    draggedTask: any = null;

    onDragStart(event: DragEvent, task: any) {
        this.isDragging = true;
        this.draggedTask = task;
        event.dataTransfer?.setData('text/plain', task.id);
        event.dataTransfer!.effectAllowed = 'move';
    }

    onDragEnd(event: DragEvent) {
        this.isDragging = false;
        this.draggedTask = null;
    }

    onDragOver(event: DragEvent) {
        event.preventDefault(); // Allow drop
        event.dataTransfer!.dropEffect = 'move';
    }

    onDrop(event: DragEvent, targetList: 'backlog' | 'sprint') {
        event.preventDefault();
        const taskId = event.dataTransfer?.getData('text/plain');
        if (!taskId) return;

        if (targetList === 'sprint') {
            if (!this.proposal.selectedTaskIds.includes(taskId)) {
                this.proposal.selectedTaskIds.push(taskId);
            }
        } else {
            const idx = this.proposal.selectedTaskIds.indexOf(taskId);
            if (idx > -1) {
                this.proposal.selectedTaskIds.splice(idx, 1);
            }
        }
    }

    // Helper to check if task is selected
    isSelected(taskId: string): boolean {
        return this.proposal.selectedTaskIds.includes(taskId);
    }

    getCapacityPercentage(): number {
        const capacity = this.calculateCapacity();
        if (capacity === 0) return 0;
        return Math.min(100, (this.getSelectedPoints() / capacity) * 100);
    }

    async analyzeBacklog() {
        this.isLoading = true;
        try {
            const token = await this.authService.getToken();
            if (!token) throw new Error("No token");
            const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
            const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/planning/analyze`, {}, { headers }));
            this.analyzedTasks = res.tasks;
        } catch (err) {
            console.error(err);
            alert('Analysis failed');
        } finally {
            this.isLoading = false;
        }
    }

    nextStep() {
        this.currentStep++;
    }

    calculateCapacity(): number {
        const { devs, days, holidays, velocity } = this.capacityInputs;
        const totalDevDays = (devs * days) - (devs * holidays); // Simplified
        return Math.round(totalDevDays * velocity);
    }

    async generateProposal() {
        this.isLoading = true;
        try {
            const token = await this.authService.getToken();
            if (!token) throw new Error("No token");
            const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
            const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/planning/propose`, {
                tasks: this.analyzedTasks,
                capacity: this.calculateCapacity()
            }, { headers }));

            this.proposal = res;
            this.currentStep = 3;
        } catch (err) {
            console.error(err);
            alert('Proposal failed');
        } finally {
            this.isLoading = false;
        }
    }

    getSelectedTasks() {
        return this.analyzedTasks.filter(t => this.proposal.selectedTaskIds.includes(t.id));
    }

    getUnselectedTasks() {
        return this.analyzedTasks.filter(t => !this.proposal.selectedTaskIds.includes(t.id));
    }

    getSelectedPoints() {
        return this.getSelectedTasks().reduce((sum, t) => sum + (t.estimate || 0), 0);
    }

    toggleSelection(taskId: string) {
        const idx = this.proposal.selectedTaskIds.indexOf(taskId);
        if (idx > -1) {
            this.proposal.selectedTaskIds.splice(idx, 1);
        } else {
            this.proposal.selectedTaskIds.push(taskId);
        }
    }

    async startSprint() {
        this.isLoading = true;
        try {
            const token = await this.authService.getToken();
            if (!token) throw new Error("No token");
            const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
            await firstValueFrom(this.http.post(`${this.apiUrl}/planning/start`, {
                taskIds: this.proposal.selectedTaskIds,
                sprintName: this.sprintName
            }, { headers }));

            this.currentStep = 4;
        } catch (err) {
            console.error(err);
            alert('Start Sprint failed');
        } finally {
            this.isLoading = false;
        }
    }
}
