import { NextResponse } from 'next/server';
import { seedPinecone } from '@/app/lib/seed-pinecone';

export async function POST(req: Request) {
  try {
    // Check for authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Log essential environment variables (but not the actual values)
    console.log('Environment check:', {
      TOGETHER_API_KEY: !!process.env.TOGETHER_API_KEY,
      PINECONE_API_KEY: !!process.env.PINECONE_API_KEY,
      PINECONE_INDEX: process.env.PINECONE_INDEX,
      ADMIN_API_KEY: !!process.env.ADMIN_API_KEY,
    });
    
    const result = await seedPinecone();
    
    if (result.success) {
      return NextResponse.json(
        { message: `Successfully seeded Pinecone with ${result.count} documents` },
        { status: 200 }
      );
    } else {
      console.error('Seeding error details:', result.error);
      return NextResponse.json(
        { error: 'Failed to seed Pinecone', details: JSON.stringify(result.error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Detailed error in seed API route:', error);
    return NextResponse.json(
      { error: 'Failed to seed Pinecone database', details: JSON.stringify(error) },
      { status: 500 }
    );
  }
}