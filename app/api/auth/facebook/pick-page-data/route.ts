import { NextRequest, NextResponse } from 'next/server'

// Returns the page list stored in the pick cookie so the client can render the picker.
export async function GET(req: NextRequest) {
  const raw = req.cookies.get('fb_page_pick')?.value
  if (!raw) return NextResponse.json({ pages: [] })

  try {
    const data = JSON.parse(Buffer.from(raw, 'base64url').toString()) as {
      pages: Array<{ id: string; name: string; access_token: string }>
    }
    // Only send id + name to the client — never the token
    return NextResponse.json({ pages: data.pages.map(p => ({ id: p.id, name: p.name })) })
  } catch {
    return NextResponse.json({ pages: [] })
  }
}
