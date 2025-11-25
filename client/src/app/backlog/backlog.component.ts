import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StandupService } from '../standup.service';

@Component({
    selector: 'app-backlog',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './backlog.component.html',
})
export class BacklogComponent implements OnInit {
    tasks: any[] = [];
    filteredTasks: any[] = [];
    selectedTask: any = null;
    isLoading = false;

    filterStatus = 'all'; // 'all', 'grooming_needed', 'ready'

    private standupService = inject(StandupService);

    ngOnInit() {
        this.loadTasks();
    }

    loadTasks() {
        this.isLoading = true;
        this.standupService.getBacklog().subscribe({
            next: (data) => {
                this.tasks = data.map(t => ({
                    ...t,
                    isGrooming: false,
                    suggestion: null,
                    // Mock AI Flags for UI Demo
                    aiFlags: {
                        warning: Math.random() > 0.8, // Unclear
                        duplicate: Math.random() > 0.9, // Duplicate
                        idea: Math.random() > 0.7 // AI Suggestion
                    }
                }));
                this.applyFilter();
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }

    applyFilter() {
        if (this.filterStatus === 'all') {
            this.filteredTasks = this.tasks;
        } else if (this.filterStatus === 'grooming_needed') {
            this.filteredTasks = this.tasks.filter(t => t.aiFlags.warning || !t.estimate);
        } else if (this.filterStatus === 'ready') {
            this.filteredTasks = this.tasks.filter(t => !t.aiFlags.warning && t.estimate);
        }
    }

    selectTask(task: any) {
        this.selectedTask = task;
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
