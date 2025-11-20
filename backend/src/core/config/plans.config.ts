export const PLAN_LIMITS = {
  FREE: {
    maxConnections: 1,
    maxUsers: 1,
    canUseWebhooks: false,
    canUseKanban: true,
  },
  STARTER: {
    maxConnections: 3,
    maxUsers: 5,
    canUseWebhooks: true,
    canUseKanban: true,
  },
  PRO: {
    maxConnections: 10,
    maxUsers: 20,
    canUseWebhooks: true,
    canUseKanban: true,
  },
};