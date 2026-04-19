import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lon = parseFloat(searchParams.get('lon') || '0');
  const dist = parseFloat(searchParams.get('dist') || '50'); // Default 50km

  if (!lat || !lon) return NextResponse.json({ error: "Coordinate mancanti" }, { status: 400 });

  // Utilizziamo una RPC (Remote Procedure Call) di Supabase per la query spaziale
  // Nota: Dobbiamo creare questa funzione nel SQL Editor (vedi sotto)
  const { data, error } = await supabase.rpc('get_nearby_announcements', {
    user_lat: lat,
    user_lon: lon,
    radius_meters: dist * 1000
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
