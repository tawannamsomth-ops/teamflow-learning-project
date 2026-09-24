import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
      },
    });

    const workspace = await this.prisma.workspace.create({
      data: {
        name: `${dto.name}'s Workspace`,
        members: { create: { userId: user.id, role: 'OWNER' } },
      },
    });

    return {
      accessToken: await this.sign(user.id, user.email),
      user: { id: user.id, email: user.email, name: user.name },
      workspace,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return {
      accessToken: await this.sign(user.id, user.email),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  private sign(userId: string, email: string) {
    return this.jwt.signAsync({ sub: userId, email });
  }
}
