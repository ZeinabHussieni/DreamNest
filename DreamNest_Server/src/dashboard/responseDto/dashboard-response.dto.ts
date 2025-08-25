export class DashboardResponseDto {
  totalGoals: number;
  inProgressGoals: number;
  completedGoals: number;
  postsPerMonth: Record<string, number>;
  goalsPerMonth: Record<string, number>;
}
