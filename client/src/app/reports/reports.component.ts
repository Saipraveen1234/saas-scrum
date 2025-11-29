import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StandupService } from '../standup.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-[calc(100vh-6rem)] flex flex-col space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Team Reports</h1>
          <p class="text-slate-500">Insights and retrospective analysis</p>
        </div>
        
        <!-- Tabs -->
        <div class="bg-slate-100 p-1 rounded-lg flex gap-1">
          <button 
            (click)="activeTab = 'velocity'"
            [class.bg-white]="activeTab === 'velocity'"
            [class.shadow-sm]="activeTab === 'velocity'"
            [class.text-indigo-600]="activeTab === 'velocity'"
            class="px-4 py-2 rounded-md text-sm font-medium text-slate-600 transition-all">
            Velocity
          </button>
          <button 
            (click)="activeTab = 'retro'"
            [class.bg-white]="activeTab === 'retro'"
            [class.shadow-sm]="activeTab === 'retro'"
            [class.text-indigo-600]="activeTab === 'retro'"
            class="px-4 py-2 rounded-md text-sm font-medium text-slate-600 transition-all">
            Retrospective
          </button>
        </div>
      </div>

      <!-- Velocity Tab -->
      <div *ngIf="activeTab === 'velocity'" class="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
        <h3 class="text-lg font-semibold text-slate-900 mb-6">Sprint Velocity</h3>
        
        <div class="h-64 flex items-end justify-around gap-4 border-b border-slate-200 pb-4">
          <div *ngFor="let sprint of velocityData" class="flex flex-col items-center gap-2 w-full max-w-[100px] group">
            <div class="relative w-full bg-indigo-100 rounded-t-lg hover:bg-indigo-200 transition-colors flex items-end justify-center overflow-hidden" [style.height.%]="(sprint.points_completed / maxVelocity) * 100">
               <span class="mb-2 text-xs font-bold text-indigo-700">{{ sprint.points_completed }}</span>
            </div>
            <span class="text-xs text-slate-500 font-medium">{{ sprint.sprint_name }}</span>
          </div>
          
          <div *ngIf="velocityData.length === 0" class="w-full h-full flex items-center justify-center text-slate-400">
            No velocity data available.
          </div>
        </div>
        
        <div class="mt-6 grid grid-cols-3 gap-6">
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span class="text-xs text-slate-500 uppercase font-bold">Average Velocity</span>
            <p class="text-2xl font-bold text-slate-900 mt-1">{{ averageVelocity }} pts</p>
          </div>
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span class="text-xs text-slate-500 uppercase font-bold">Last Sprint</span>
            <p class="text-2xl font-bold text-slate-900 mt-1">{{ lastVelocity }} pts</p>
          </div>
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span class="text-xs text-slate-500 uppercase font-bold">Trend</span>
            <p class="text-2xl font-bold mt-1" [class.text-emerald-600]="trend === 'Up'" [class.text-red-600]="trend === 'Down'">
              {{ trend }}
            </p>
          </div>
        </div>
      </div>

      <!-- Retro Tab -->
      <div *ngIf="activeTab === 'retro'" class="flex-1 flex flex-col animate-fade-in">
        <div class="flex justify-end mb-4">
          <button 
            (click)="analyzeRetro()" 
            [disabled]="isAnalyzing || retroItems.length === 0"
            class="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 disabled:opacity-50 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {{ isAnalyzing ? 'Analyzing...' : 'Analyze Feedback' }}
          </button>
        </div>

        <div class="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
          <!-- Went Well -->
          <div class="flex flex-col bg-emerald-50/50 rounded-xl border border-emerald-100 overflow-hidden">
            <div class="p-4 border-b border-emerald-100 bg-emerald-50">
              <h3 class="font-semibold text-emerald-900">Went Well</h3>
            </div>
            <div class="flex-1 p-4 space-y-3 overflow-y-auto">
              <div *ngFor="let item of getItems('went_well')" class="bg-white p-3 rounded shadow-sm border border-emerald-100 text-sm text-slate-700">
                {{ item.content }}
              </div>
              <div class="flex gap-2">
                <input type="text" [(ngModel)]="newItem.went_well" (keyup.enter)="addItem('went_well')" class="flex-1 text-sm rounded border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Add item...">
                <button (click)="addItem('went_well')" class="text-emerald-600 hover:bg-emerald-100 p-2 rounded">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
            </div>
          </div>

          <!-- To Improve -->
          <div class="flex flex-col bg-red-50/50 rounded-xl border border-red-100 overflow-hidden">
            <div class="p-4 border-b border-red-100 bg-red-50">
              <h3 class="font-semibold text-red-900">To Improve</h3>
            </div>
            <div class="flex-1 p-4 space-y-3 overflow-y-auto">
              <div *ngFor="let item of getItems('needs_improvement')" class="bg-white p-3 rounded shadow-sm border border-red-100 text-sm text-slate-700">
                {{ item.content }}
              </div>
              <div class="flex gap-2">
                <input type="text" [(ngModel)]="newItem.needs_improvement" (keyup.enter)="addItem('needs_improvement')" class="flex-1 text-sm rounded border-red-200 focus:ring-red-500 focus:border-red-500" placeholder="Add item...">
                <button (click)="addItem('needs_improvement')" class="text-red-600 hover:bg-red-100 p-2 rounded">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Action Items -->
          <div class="flex flex-col bg-blue-50/50 rounded-xl border border-blue-100 overflow-hidden">
            <div class="p-4 border-b border-blue-100 bg-blue-50">
              <h3 class="font-semibold text-blue-900">Action Items</h3>
            </div>
            <div class="flex-1 p-4 space-y-3 overflow-y-auto">
              <div *ngFor="let item of getItems('action_item')" class="bg-white p-3 rounded shadow-sm border border-blue-100 text-sm text-slate-700 flex items-start gap-2">
                <input type="checkbox" class="mt-1 rounded text-blue-600 focus:ring-blue-500 border-slate-300">
                <span>{{ item.content }}</span>
              </div>
              <div class="flex gap-2">
                <input type="text" [(ngModel)]="newItem.action_item" (keyup.enter)="addItem('action_item')" class="flex-1 text-sm rounded border-blue-200 focus:ring-blue-500 focus:border-blue-500" placeholder="Add item...">
                <button (click)="addItem('action_item')" class="text-blue-600 hover:bg-blue-100 p-2 rounded">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Analysis Result -->
        <div *ngIf="retroAnalysis" class="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-6 animate-fade-in">
          <h3 class="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
             AI Insights
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-bold text-indigo-700 uppercase tracking-wider mb-2">Key Themes</h4>
              <ul class="space-y-2">
                <li *ngFor="let theme of retroAnalysis.themes" class="flex items-start gap-2 text-sm text-indigo-900">
                  <span class="bg-indigo-200 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-bold">{{ theme.count }}</span>
                  <span>{{ theme.summary }}</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 class="text-sm font-bold text-indigo-700 uppercase tracking-wider mb-2">Sentiment</h4>
              <div class="flex items-center gap-2">
                <span class="text-2xl" [ngSwitch]="retroAnalysis.sentiment">
                  <span *ngSwitchCase="'positive'">😊</span>
                  <span *ngSwitchCase="'negative'">😟</span>
                  <span *ngSwitchDefault>😐</span>
                </span>
                <span class="text-indigo-900 font-medium capitalize">{{ retroAnalysis.sentiment }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class ReportsComponent implements OnInit {
  activeTab: 'velocity' | 'retro' = 'velocity';
  
  velocityData: any[] = [];
  maxVelocity = 0;
  averageVelocity = 0;
  lastVelocity = 0;
  trend = 'Stable';

  retroItems: any[] = [
    { type: 'went_well', content: 'Released feature X on time' },
    { type: 'needs_improvement', content: 'Too many meetings' },
    { type: 'action_item', content: 'Update documentation' }
  ];
  newItem = { went_well: '', needs_improvement: '', action_item: '' };
  
  isAnalyzing = false;
  retroAnalysis: any = null;

  private standupService = inject(StandupService);

  ngOnInit() {
    this.loadVelocity();
  }

  loadVelocity() {
    this.standupService.getSprintVelocity().subscribe({
      next: (data) => {
        this.velocityData = data;
        if (data.length > 0) {
          const points = data.map(d => d.points_completed);
          this.maxVelocity = Math.max(...points, 1); // Avoid div by 0
          this.averageVelocity = Math.round(points.reduce((a, b) => a + b, 0) / points.length);
          this.lastVelocity = points[points.length - 1];
          
          if (points.length >= 2) {
            const prev = points[points.length - 2];
            this.trend = this.lastVelocity > prev ? 'Up' : (this.lastVelocity < prev ? 'Down' : 'Stable');
          }
        }
      },
      error: (err) => console.error(err)
    });
  }

  getItems(type: string) {
    return this.retroItems.filter(i => i.type === type);
  }

  addItem(type: 'went_well' | 'needs_improvement' | 'action_item') {
    if (!this.newItem[type]) return;
    
    this.retroItems.push({ type, content: this.newItem[type] });
    this.newItem[type] = '';
  }

  analyzeRetro() {
    this.isAnalyzing = true;
    const feedback = this.retroItems
      .filter(i => i.type !== 'action_item')
      .map(i => `${i.type}: ${i.content}`);
      
    this.standupService.analyzeRetro(feedback).subscribe({
      next: (res) => {
        this.retroAnalysis = res;
        this.isAnalyzing = false;
      },
      error: () => {
        alert('Analysis failed');
        this.isAnalyzing = false;
      }
    });
  }
}
