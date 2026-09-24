import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateWorkspaceDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;
}

export class AddMemberDto {
  @ApiProperty()
  @IsString()
  email!: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
