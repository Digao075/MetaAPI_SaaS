import { Controller, Post, Body, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('v1/auth') 
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: { email: string; password: string; companyName: string }) {
    return this.authService.register(body);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    this.logger.log(`Solicitação de recuperação de senha para: ${body.email}`);
    
    await this.authService.sendRecoveryEmail(body.email);

    return { 
      message: 'Se o email existir, enviamos um link de recuperação.' 
    };
  }
}