import { All, Controller, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";

import { auth } from "./auth.config.js";

const authHandler = toNodeHandler(auth);

@Controller("auth")
export class AuthController {
  @All("*path")
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    await authHandler(req, res);
  }
}
