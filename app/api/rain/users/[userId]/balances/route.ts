import { NextRequest, NextResponse } from 'next/server';
import { getRainClient } from '@/lib/rainClient';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const rainClient = getRainClient();
    const balances = await rainClient.getUserCreditBalances(userId);
    return NextResponse.json(balances);
  } catch (error) {
    console.error('Error fetching Rain user balances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user balances' },
      { status: 500 }
    );
  }
}
