import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  getSummary() {
    return {
      level: 4,
      rankName: 'Security Guard',
      xp: 450,
      nextLevelXp: 500,
      streak: 7,
      securityScore: 78,
      completedChallenges: 12,
    };
  }
}
