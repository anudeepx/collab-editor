import { prisma } from './prisma.js';

async function main() {
    const nonce = Date.now();
    const email = `mock-user-${nonce}@example.com`;

    const createdUser = await prisma.user.create({
        data: {
            name: 'Mock User',
            email,
            sessions: {
                create: {
                  id: `session-${nonce}`,
                  token: `token-${nonce}`,
                  expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
                },
            },
            accounts: {
                create: {
                    id: `account-${nonce}`,
                    accountId: `mock-account-${nonce}`,
                    providerId: 'mock-provider',
                },
            },
        },
        include: {
            sessions: true,
            accounts: true,
        },
    });

    const retrievedUser = await prisma.user.findUnique({
        where: { email },
        include: {
            sessions: true,
            accounts: true,
        },
    });

    console.log('Created user:', createdUser);
    console.log('Retrieved user:', retrievedUser);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error('DB test failed:', error);
        await prisma.$disconnect();
        process.exit(1);
    });
