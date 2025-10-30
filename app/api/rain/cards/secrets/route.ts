import { NextRequest, NextResponse } from 'next/server';
import { getRainClient } from '@/lib/rainClient';

export async function POST(request: NextRequest) {
  try {
    const { cardId } = await request.json();

    if (!cardId) {
      return NextResponse.json(
        { error: 'cardId is required' },
        { status: 400 }
      );
    }

    const rainClient = getRainClient();
    
    // Get decrypted card data (PAN and CVC)
    const cardData = await rainClient.getDecryptedCardData(cardId);

    return NextResponse.json({
      cardNumber: cardData.cardNumber,
      cvc: cardData.cvc,
    });
  } catch (error) {
    console.error('Error getting Rain card secrets:', error);
    return NextResponse.json(
      { error: 'Failed to get card secrets' },
      { status: 500 }
    );
  }
}