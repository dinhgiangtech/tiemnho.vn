const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Testing connection to PostgreSQL...');
  const count = await prisma.creatorProfile.count();
  console.log('CreatorProfile count:', count);
  const products = await prisma.product.findMany();
  console.log('Products count:', products.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
