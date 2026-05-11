import { PrismaClient } from './prisma/generated/client/index.js';
console.log("Instantiating PrismaClient...");
const prisma = new PrismaClient();
console.log("Success!");
