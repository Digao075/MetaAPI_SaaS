import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { PlanType } from '@prisma/client'; 

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async upgradeTenantByEmail(email: string, planName: string) {
    this.logger.log(`Processando upgrade para: ${email} -> Plano: ${planName}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user || !user.tenantId) {
      this.logger.error(`Usuário não encontrado ou sem tenant: ${email}`);
      return false;
    }

    let targetPlan: PlanType = 'FREE';
    const planUpper = planName.toUpperCase();

    if (planUpper.includes('STARTER')) targetPlan = 'STARTER';
    if (planUpper.includes('PRO')) targetPlan = 'PRO';
    await this.prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        plan: targetPlan,
        planStatus: 'ACTIVE',
      },
    });

    this.logger.log(`SUCESSO: Tenant ${user.tenantId} atualizado para ${targetPlan}`);
    return true;
  }
}