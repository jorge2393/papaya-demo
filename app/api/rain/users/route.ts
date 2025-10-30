import { NextRequest, NextResponse } from 'next/server';
import { getRainClient } from '@/lib/rainClient';

// Simple in-memory storage for demo
// In production, use a proper database
const userStore = new Map<string, string>(); // walletAddress -> rainUserId

/**
 * Rain Users API
 * 
 * POST - Create or retrieve Rain user application
 *        Creates user with KYC bypass (lastName: "approved")
 *        Returns userId for subsequent card creation
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, email } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      );
    }

    // Check if user already exists (in-memory)
    const existingUserId = userStore.get(walletAddress);
    const rainClient = getRainClient();
    if (existingUserId) {
      // Treat as approved (KYC bypass per demo)
      const user = await rainClient.getUserApplication(existingUserId).catch(() => null);
      return NextResponse.json({
        rainUserId: existingUserId,
        applicationStatus: user?.applicationStatus || 'approved',
        email: user?.email || email,
      });
    }

    // Try to find existing Rain user by walletAddress via API
    try {
      const users = await rainClient.getUsers(100);
      const found = users.find((u: any) => u.walletAddress === walletAddress);
      if (found) {
        userStore.set(walletAddress, found.id);
        return NextResponse.json({
          rainUserId: found.id,
          applicationStatus: found.applicationStatus || 'approved',
          email: found.email,
        });
      }
    } catch {
      // ignore and continue to create
    }

    // Create new user application (KYC bypass expected in dev)
    const walletEmail = email || `${walletAddress}@example.com`;
    const user = await rainClient.startUserApplicationFull({
      firstName: walletEmail,
      lastName: 'approved',
      birthDate: '1990-01-01',
      nationalId: '123456789',
      countryOfIssue: 'US',
      email: walletEmail,
      address: {
        line1: '123 Test Street',
        city: 'San Francisco',
        region: 'CA',
        postalCode: '94105',
        countryCode: 'US',
      },
      ipAddress: '127.0.0.1',
      phoneCountryCode: '1',
      phoneNumber: '5551234567',
      annualSalary: '75000',
      accountPurpose: 'personal',
      expectedMonthlyVolume: '2000',
      isTermsOfServiceAccepted: true,
      walletAddress,
    });
    userStore.set(walletAddress, user.id);

    return NextResponse.json({
      rainUserId: user.id,
      applicationStatus: user.applicationStatus || 'approved',
      email: user.email,
    });
  } catch (error) {
    console.error('Error starting Rain application:', error);
    return NextResponse.json(
      { error: 'Failed to start Rain application' },
      { status: 500 }
    );
  }
}
