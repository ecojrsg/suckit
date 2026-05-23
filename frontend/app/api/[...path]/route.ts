import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Await the params object to satisfy Next.js dynamic routing requirements
  const resolvedParams = await params;
  const pathStr = resolvedParams.path.join('/');
  const targetUrl = `${BACKEND_URL}/api/${pathStr}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    // Forward standard headers, skip connection/host to prevent proxy loop/socket issues
    if (!['host', 'connection', 'origin', 'referer', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const options: RequestInit = {
    method: request.method,
    headers,
  };

  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const bodyText = await request.text();
      options.body = bodyText;
    } catch {
      // No body or failed to read
    }
  }

  try {
    const response = await fetch(targetUrl, options);
    
    // Determine content type
    const contentType = response.headers.get('content-type') || '';
    
    // For file downloads, serve the blob/stream directly with headers
    if (contentType.includes('application/octet-stream') || pathStr.endsWith('/file')) {
      const blob = await response.blob();
      return new NextResponse(blob, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': response.headers.get('content-disposition') || '',
        },
      });
    }

    const data = await response.json().catch(() => null);
    if (data) {
      return NextResponse.json(data, { status: response.status });
    }

    const text = await response.text();
    return new NextResponse(text, { status: response.status });
  } catch (error) {
    console.error(`Proxy error for ${targetUrl}:`, error);
    return NextResponse.json(
      { detail: 'No se pudo conectar con el servidor backend de descargas.' },
      { status: 502 }
    );
  }
}

export {
  handleProxy as GET,
  handleProxy as POST,
  handleProxy as PUT,
  handleProxy as DELETE,
};
