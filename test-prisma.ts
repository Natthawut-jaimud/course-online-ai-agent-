import prisma from './lib/prisma.ts';
async function main() {
  const users = await prisma.user.findMany();
  console.log(users);
}
main().catch(console.error);
