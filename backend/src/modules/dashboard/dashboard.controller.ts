import { Controller, Get, Headers } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async getDashboard(@Headers('authorization') authorization?: string) {
    try {
      const user = await this.authService.me(authorization);
      return this.dashboardService.getSummary(user);
    } catch {
      return this.dashboardService.getSummary();
    }
  }
}
