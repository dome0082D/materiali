'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix icone Leaflet
const icon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

export default function Mappa({ announcements = [] }: { announcements?: any[] }) {
  return (
    <MapContainer center={[41.8719, 12.5674]} zoom={6} className="h-full w-full min-h-[400px]">
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        attribution='&copy; OpenStreetMap'
      />
      {announcements.map((ann) => (
        ann.latitude && ann.longitude ? (
          <Marker key={ann.id} position={[ann.latitude, ann.longitude]} icon={icon}>
            <Popup>
              <div className="w-40 font-sans">
                {ann.image_url ? (
                  <img src={ann.image_url} alt={ann.title} className="w-full h-20 object-cover rounded mb-2" />
                ) : (
                  <div className="w-full h-20 bg-stone-100 rounded mb-2 flex items-center justify-center text-[10px] text-stone-400">No Foto</div>
                )}
                <p className="font-bold text-[10px] uppercase truncate">{ann.title}</p>
                <p className="text-rose-500 font-black">€ {ann.price}</p>
                <a href={`/announcement/${ann.id}`} className="text-[10px] text-blue-500 underline font-bold mt-1 block">Vedi Annuncio</a>
              </div>
            </Popup>
          </Marker>
        ) : null
      ))}
    </MapContainer>
  )
}