import { Controller, Get, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../core/prisma/prisma.service';

@Controller('v1/admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('global-stats')
  @UseGuards(AuthGuard('jwt'))
  async getGlobalStats(@Req() req: any) {
    const user = req.user;

    const currentUser = await this.prisma.user.findUnique({ 
        where: { id: user.userId } 
    });

    if (currentUser?.role !== 'dev') {
      throw new UnauthorizedException('Acesso restrito aos desenvolvedores (God Mode).');
    }


    const totalTenants = await this.prisma.tenant.count();
    const totalContacts = await this.prisma.contact.count();
    const totalMessages = await this.prisma.message.count();


    const tenants = await this.prisma.tenant.findMany({
      include: {
        _count: {
          select: { 
            contacts: true, 
            messages: true,
            users: true 
          }
        },
        connections: {
            select: { phone_number_id: true, name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const tenantsWithStats = tenants.map(t => {
        const daysActive = Math.max(1, Math.floor((new Date().getTime() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24)));
        const avgLeads = Math.floor(t._count.contacts / daysActive);
        
        return {
            id: t.id,
            name: t.name,
            plan: t.plan,
            webhook: t.webhookUrl ? 'Sim' : 'Não',
            users: t._count.users,
            leads: t._count.contacts,
            msgs: t._count.messages,
            avgLeadsPerDay: avgLeads,
            createdAt: t.createdAt,
            hasConnection: t.connections && t.connections.length > 0 
        };
    });

    return {
      global: {
        totalTenants,
        totalContacts,
        totalMessages,
        revenueEstimate: tenants.filter(t => t.plan === 'PRO').length * 197 + tenants.filter(t => t.plan === 'STARTER').length * 97
      },
      tenants: tenantsWithStats
    };
  }
}