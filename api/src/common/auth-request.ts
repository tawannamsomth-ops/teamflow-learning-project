import { Role } from '@prisma/client';
import { Request } from 'express';

export type AuthUser = {
  userId: string;
  email: string;
  workspaceRole?: Role;
};

export type AuthedRequest = Request & {
  user?: AuthUser;
};
