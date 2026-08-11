import { Injectable } from '@nestjs/common';

type DashboardUser = {
  id: string;
  createdAt: string;
};

@Injectable()
export class DashboardService {
  getSummary(user?: DashboardUser) {
    if (!user) {
      return {
        level: 1,
        rankName: 'New Learner',
        xp: 0,
        nextLevelXp: 500,
        streak: 0,
        securityScore: 0,
        completedChallenges: 0,
      };
    }

    const accountAgeDays = Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86_400_000));
    const userSeed = this.userSeed(user.id);
    const completedChallenges = 0;
    const xp = completedChallenges * 50;
    const level = Math.max(1, Math.floor(xp / 500) + 1);

    return {
      level,
      rankName: completedChallenges >= 10 ? 'Security Guard' : completedChallenges >= 3 ? 'Link Inspector' : 'New Learner',
      xp,
      nextLevelXp: 500,
      streak: accountAgeDays > 0 ? Math.min(7, (userSeed % 3) + 1) : 0,
      securityScore: completedChallenges > 0 ? Math.min(100, 45 + completedChallenges * 6) : 0,
      completedChallenges,
    };
  }

  private userSeed(id: string) {
    return id.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  }
}
