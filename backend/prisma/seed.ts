import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const libsql = createClient({
  url: 'file:./prisma/dev.db',
});

const adapter = new PrismaLibSql({
  url: 'file:./prisma/dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Start seeding...');

  // Create users
  const user1 = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: 'hashed_password_123', // In production, use proper password hashing
      name: 'Admin User',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: 'hashed_password_456',
      name: 'Regular User',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created users:', user1.email, user2.email);

  // Create sessions
  const session1 = await prisma.session.create({
    data: {
      userId: user1.id,
      token: 'session_token_admin_abc123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdAt: new Date(),
    },
  });

  console.log('✅ Created session for:', user1.email);

  // Create dashboards
  const dashboard1 = await prisma.dashboard.create({
    data: {
      userId: user1.id,
      name: 'System Overview',
      config: JSON.stringify({
        layout: 'grid',
        columns: 3,
        refreshInterval: 30000,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const dashboard2 = await prisma.dashboard.create({
    data: {
      userId: user1.id,
      name: 'Performance Metrics',
      config: JSON.stringify({
        layout: 'list',
        columns: 2,
        refreshInterval: 60000,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created dashboards:', dashboard1.name, dashboard2.name);

  // Create widgets for dashboard1
  const widget1 = await prisma.widget.create({
    data: {
      dashboardId: dashboard1.id,
      type: 'metric',
      config: JSON.stringify({
        title: 'CPU Usage',
        unit: '%',
        threshold: 80,
      }),
      position: 1,
      createdAt: new Date(),
    },
  });

  const widget2 = await prisma.widget.create({
    data: {
      dashboardId: dashboard1.id,
      type: 'chart',
      config: JSON.stringify({
        title: 'Memory Usage',
        chartType: 'line',
        dataPoints: 24,
      }),
      position: 2,
      createdAt: new Date(),
    },
  });

  const widget3 = await prisma.widget.create({
    data: {
      dashboardId: dashboard1.id,
      type: 'table',
      config: JSON.stringify({
        title: 'Active Processes',
        columns: ['name', 'cpu', 'memory'],
      }),
      position: 3,
      createdAt: new Date(),
    },
  });

  // Create widgets for dashboard2
  const widget4 = await prisma.widget.create({
    data: {
      dashboardId: dashboard2.id,
      type: 'metric',
      config: JSON.stringify({
        title: 'Request Rate',
        unit: 'req/s',
        threshold: 1000,
      }),
      position: 1,
      createdAt: new Date(),
    },
  });

  const widget5 = await prisma.widget.create({
    data: {
      dashboardId: dashboard2.id,
      type: 'chart',
      config: JSON.stringify({
        title: 'Response Time',
        chartType: 'area',
        dataPoints: 60,
      }),
      position: 2,
      createdAt: new Date(),
    },
  });

  console.log('✅ Created widgets:', widget1.type, widget2.type, widget3.type, widget4.type, widget5.type);

  console.log('🌱 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
