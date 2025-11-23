import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService, Team, UserWithTeam } from '../team.service';

@Component({
    selector: 'app-team-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './team-management.component.html',
})
export class TeamManagementComponent implements OnInit {
    teams: Team[] = [];
    users: UserWithTeam[] = [];
    newTeamName = '';
    isLoading = false;

    private teamService = inject(TeamService);

    ngOnInit() {
        this.loadData();
    }

    async loadData() {
        (await this.teamService.getTeams()).subscribe(teams => this.teams = teams);
        (await this.teamService.getUsers()).subscribe(users => this.users = users);
    }

    async createTeam() {
        if (!this.newTeamName) return;

        this.isLoading = true;
        (await this.teamService.createTeam(this.newTeamName)).subscribe({
            next: (team) => {
                this.teams.push(team);
                this.newTeamName = '';
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }

    async assignUser(user: UserWithTeam, teamId: any) {
        // teamId comes as string from select sometimes, ensure number
        const id = teamId ? Number(teamId) : null;

        // Optimistic update
        const oldTeamId = user.team_id;
        const oldTeamName = user.team_name;

        const team = this.teams.find(t => t.id === id);
        user.team_id = id;
        user.team_name = team ? team.name : null;

        (await this.teamService.assignUserToTeam(user.user_id, id!)).subscribe({
            error: (err) => {
                console.error(err);
                // Revert on error
                user.team_id = oldTeamId;
                user.team_name = oldTeamName;
            }
        });
    }
}
