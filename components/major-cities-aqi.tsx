"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AQIBadge from "./aqi-badge"
import { Loader2 } from "lucide-react"

interface CityAQI {
  name: string
  lat: number
  lon: number
  aqi: number | null
  loading: boolean
}

const MAJOR_INDIAN_CITIES = [
  { name: "Delhi", lat: 28.7041, lon: 77.1025 },
  { name: "Mumbai", lat: 19.076, lon: 72.8777 },
  { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
  { name: "Hyderabad", lat: 17.385, lon: 78.4867 },
  { name: "Chennai", lat: 13.0827, lon: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { name: "Pune", lat: 18.5204, lon: 73.8567 },
  { name: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
]

export default function MajorCitiesAQI() {
  const [cities, setCities] = useState<CityAQI[]>(
    MAJOR_INDIAN_CITIES.map((city) => ({
      ...city,
      aqi: null,
      loading: true,
    })),
  )

  useEffect(() => {
    const fetchAllCitiesAQI = async () => {
      const updatedCities = await Promise.all(
        cities.map(async (city) => {
          try {
            const response = await fetch(`/api/aqi?lat=${city.lat}&lon=${city.lon}`)
            if (!response.ok) {
              const errorData = await response.json()
              console.warn(`API Route Warning for ${city.name}:`, errorData.error)
              throw new Error(`Failed to fetch AQI data for ${city.name}`)
            }
            const data = await response.json()
            return { ...city, aqi: data.aqi, loading: false }
          } catch (err) {
            console.warn(`Failed to fetch AQI for ${city.name}:`, err)
            return { ...city, loading: false }
          }
        }),
      )
      setCities(updatedCities)
    }

    fetchAllCitiesAQI()
  }, [])

  return (
    <section className="max-w-6xl mx-auto mt-10 px-6">
      <Card className="border border-white/15 bg-white/10 text-slate-100 shadow-2xl backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-50">Major Indian Cities AQI</CardTitle>
          <CardDescription className="text-sm text-slate-300">
            Real-time US AQI (0-500) across India
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center items-stretch">
            {cities.map((city) => (
              <div
                key={city.name}
                className="w-36 h-36 sm:w-40 sm:h-40 rounded-xl border border-white/10 bg-white/10 p-4 text-center text-slate-100 shadow-lg backdrop-blur transition hover:bg-white/15"
              >
                <h3 className="font-semibold text-slate-100">{city.name}</h3>
                {city.loading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-300" />
                ) : city.aqi !== null ? (
                  <AQIBadge aqi={city.aqi} size="small" />
                ) : (
                  <p className="text-xs text-slate-300">Unable to load</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
