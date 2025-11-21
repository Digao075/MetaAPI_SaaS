import { Injectable, BadRequestException, Logger } from '@nestjs/common'; 
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../core/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      tenantId: user.tenantId 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(data: { email: string; password: string; companyName: string }) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new BadRequestException('Este email já está em uso.');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(data.password, salt);

    const result = await this.prisma.$transaction(async (prisma) => {

      const tenant = await prisma.tenant.create({
        data: {
          name: data.companyName,
          plan: 'FREE',
          planStatus: 'ACTIVE'
        },
      });

      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash: passwordHash,
          role: 'admin',
          tenantId: tenant.id,
        },
      });

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { ownerId: user.id },
      });

      return user;
    });

    return this.login(result);
  }

  async sendRecoveryEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const recoveryLink = `https://seusaas.com/reset-password?token=simulacao123`;
      
      this.logger.warn(`==================================================`);
      this.logger.warn(`📧 [MOCK EMAIL] Enviando para: ${email}`);
      this.logger.warn(`🔗 Link: ${recoveryLink}`);
      this.logger.warn(`==================================================`);
    }
    
    return true;
  }
}