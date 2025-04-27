import { NextResponse } from 'next/server';
import { seedPinecone } from '@/app/lib/seed-pinecone';

export async function POST(req: Request) {
  try {
    // Check for authorization (optional)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const result = await seedPinecone();
    
    if (result.success) {
      return NextResponse.json(
        { message: `Successfully seeded Pinecone with ${result.count} documents` },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to seed Pinecone', details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in seed API route:', error);
    return NextResponse.json(
      { error: 'Failed to seed Pinecone database' },
      { status: 500 }
    );
  }
}