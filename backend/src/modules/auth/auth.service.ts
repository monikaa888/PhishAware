import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AuthService {
  register(body: { email: string; displayName: string }) {
    return {
      user: {
        id: randomUUID(),
        email: body.email,
        displayName: body.displayName,
      },
      accessToken: 'mock-access-token',
    };
  }

  login(body: { email: string }) {
    return {
      user: {
        id: 'demo-user',
        email: body.email,
        displayName: 'Demo Learner',
      },
      accessToken: 'mock-access-token',
    };
  }
}
