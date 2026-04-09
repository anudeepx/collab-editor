import {
  UnauthorizedException,
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";

type AuthenticatedRequest = {
  userId?: string;
};

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.userId) {
      throw new UnauthorizedException("Authentication required");
    }

    return request.userId;
  },
);
