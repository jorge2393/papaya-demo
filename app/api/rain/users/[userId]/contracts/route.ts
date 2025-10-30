import { NextRequest, NextResponse } from 'next/server';
import { getRainClient } from '@/lib/rainClient';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const rainClient = getRainClient();
    const contracts = await rainClient.getUserContractsWithRetry(userId, 84532); // Base Sepolia

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error fetching Rain user contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user contracts' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const { chainId } = await request.json();

    if (!userId || !chainId) {
      return NextResponse.json(
        { error: 'userId and chainId are required' },
        { status: 400 }
      );
    }

    const rainClient = getRainClient();
    try {
      await rainClient.createUserContract(userId, chainId);
      return NextResponse.json({ success: true, message: 'Contract created' });
    } catch (error: any) {
      if (error.message.includes('409')) { // Conflict: contract already exists
        return NextResponse.json({ success: true, message: 'Contract already exists' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating Rain user contract:', error);
    return NextResponse.json(
      { error: 'Failed to create Rain user contract' },
      { status: 500 }
    );
  }
}
