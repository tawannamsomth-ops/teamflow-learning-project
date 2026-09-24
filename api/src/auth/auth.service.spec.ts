jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {
    signAsync = jest.fn();
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    workspace: { create: jest.fn() },
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    jwt.signAsync.mockResolvedValue('token');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('registers a new user and workspace', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
    });
    prisma.workspace.create.mockResolvedValue({
      id: 'w1',
      name: "A's Workspace",
    });

    const result = await service.register({
      email: 'a@b.com',
      password: 'secret1',
      name: 'A',
    });

    expect(result.accessToken).toBe('token');
    expect(result.user.email).toBe('a@b.com');
    expect(prisma.workspace.create).toHaveBeenCalled();
  });

  it('rejects duplicate email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(
      service.register({ email: 'a@b.com', password: 'secret1', name: 'A' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects bad login', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'a@b.com', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
