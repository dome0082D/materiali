import { supabase } from '@/lib/supabase'
import { Metadata, ResolvingMetadata } from 'next'
import AnnouncementClientWrapper from './AnnouncementClient'

// IL PEZZO MANCANTE: LA SEO CHE FUNZIONA SU VERCEL
export async function generateMetadata(
  { params }: { params: { id: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id
  const { data } = await supabase.from('announcements').select('*').eq('id', id).single()

  if (!data) return { title: 'Annuncio non trovato - Re-love' }

  return {
    title: `${data.title} - Re-love`,
    description: data.description || 'Acquista su Re-love',
    openGraph: {
      title: `${data.title} a soli €${data.price}`,
      description: 'Vieni a scoprire questo annuncio su Re-love!',
      images: [data.image_url || '/usato.png'],
    },
  }
}

export default function Page() {
  return <AnnouncementClientWrapper />
}