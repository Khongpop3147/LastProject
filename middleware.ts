import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Redirect /uploads/* to /api/file/*
  if (request.nextUrl.pathname.startsWith('/uploads/')) {
    const filePath = request.nextUrl.pathname.replace(/^\/uploads\//, '')
    return NextResponse.rewrite(new URL(`/api/file/${filePath}`, request.url))
  }
}

export const config = {
  matcher: ['/uploads/:path*'],
}
