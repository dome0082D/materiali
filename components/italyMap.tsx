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

export default function italymap({ announcements }: { announcements: any[] }) {
  return (
    <MapContainer center={[41.8719, 12.5674]} zoom={6} className="h-full w-full">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {announcements.map((ann) => (
        ann.latitude && ann.longitude && (
          <Marker key={ann.id} position={[ann.latitude, ann.longitude]} icon={icon}>
            <Popup>
              <div className="w-40 font-sans">
                <img src={ann.image_url} className="w-full h-20 object-cover rounded mb-2" />
                <p className="font-bold text-[10px] uppercase truncate">{ann.title}</p>
                <p className="text-rose-500 font-black">€ {ann.price}</p>
                <a href={`/announcement/${ann.id}`} className="text-[10px] text-blue-500 underline font-bold mt-1 block">Vedi Annuncio</a>
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  )
}