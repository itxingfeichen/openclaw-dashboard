import prisma from './src/db/prisma.js';

async function testModels() {
  console.log('🧪 Testing Prisma models...\n');

  try {
    // Test 1: Create a User
    console.log('1. Creating a test user...');
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashed_password_123',
        name: 'Test User',
        role: 'admin',
      },
    });
    console.log(`   ✓ User created: ${user.id} (${user.email})`);

    // Test 2: Create a Session
    console.log('2. Creating a test session...');
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: 'test_token_abc123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });
    console.log(`   ✓ Session created: ${session.id}`);

    // Test 3: Create a Dashboard
    console.log('3. Creating a test dashboard...');
    const dashboard = await prisma.dashboard.create({
      data: {
        userId: user.id,
        name: 'My Dashboard',
        config: JSON.stringify({ theme: 'dark', layout: 'grid' }),
      },
    });
    console.log(`   ✓ Dashboard created: ${dashboard.id} (${dashboard.name})`);

    // Test 4: Create a Widget
    console.log('4. Creating a test widget...');
    const widget = await prisma.widget.create({
      data: {
        dashboardId: dashboard.id,
        type: 'chart',
        config: JSON.stringify({ chartType: 'bar', dataSource: 'api' }),
        position: JSON.stringify({ x: 0, y: 0, w: 6, h: 4 }),
      },
    });
    console.log(`   ✓ Widget created: ${widget.id} (${widget.type})`);

    // Test 5: Query with relations
    console.log('5. Testing relations...');
    const userWithRelations = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        sessions: true,
        dashboards: {
          include: {
            widgets: true,
          },
        },
      },
    });
    console.log(`   ✓ User has ${userWithRelations?.sessions.length} session(s)`);
    console.log(`   ✓ User has ${userWithRelations?.dashboards.length} dashboard(s)`);
    console.log(`   ✓ Dashboard has ${userWithRelations?.dashboards[0].widgets.length} widget(s)`);

    // Test 6: Update operations
    console.log('6. Testing update operations...');
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: 'Updated Test User' },
    });
    console.log(`   ✓ User updated: ${updatedUser.name}`);

    // Cleanup: Delete test data
    console.log('7. Cleaning up test data...');
    await prisma.widget.deleteMany({ where: { dashboardId: dashboard.id } });
    await prisma.dashboard.deleteMany({ where: { userId: user.id } });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('   ✓ Test data cleaned up');

    console.log('\n✅ All tests passed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testModels();
