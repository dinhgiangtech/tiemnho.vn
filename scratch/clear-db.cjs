const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🧹 Clearing all mock data from PostgreSQL...');

  const deletedOrders = await prisma.order.deleteMany();
  console.log(`- Deleted ${deletedOrders.count} orders`);

  const deletedLeads = await prisma.lead.deleteMany();
  console.log(`- Deleted ${deletedLeads.count} leads`);

  const deletedProducts = await prisma.product.deleteMany();
  console.log(`- Deleted ${deletedProducts.count} products`);

  // Verify counts
  const [productCount, orderCount, leadCount] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.lead.count()
  ]);

  console.log('\n📊 Current Database State:');
  console.log(`• Products: ${productCount}`);
  console.log(`• Orders:   ${orderCount}`);
  console.log(`• Leads:    ${leadCount}`);
  console.log('\n✨ Database is completely fresh and ready for creating new data from scratch!');
}

clearDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
