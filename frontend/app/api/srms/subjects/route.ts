import { NextRequest, NextResponse } from 'next/server';
import { GET as allGet, POST as allPost } from '../all-subjects/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return allGet(req);
}

export async function POST(req: NextRequest) {
  return allPost(req);
}
