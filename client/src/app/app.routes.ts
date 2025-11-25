import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PostUpdateComponent } from './post-update/post-update.component';
import { StandupComponent } from './standup/standup.component';
import { BacklogComponent } from './backlog/backlog.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'post', component: PostUpdateComponent, canActivate: [authGuard] },
    { path: 'feed', component: StandupComponent, canActivate: [authGuard] },
    { path: 'backlog', component: BacklogComponent, canActivate: [authGuard] },
    {
        path: 'teams',
        loadComponent: () => import('./team-management/team-management.component').then(m => m.TeamManagementComponent),
        canActivate: [authGuard]
    },
    {
        path: 'tasks',
        loadComponent: () => import('./tasks/tasks.component').then(m => m.TasksComponent),
        canActivate: [authGuard]
    },
    {
        path: 'settings',
        loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [authGuard]
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];
