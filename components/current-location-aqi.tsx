"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import AQIBadge from "./aqi-badge"
import { Loader2, MapPin, Wind, Droplets, Thermometer } from "lucide-react"

interface CurrentLocationAQIProps {
  onAQIUpdate: (aqi: number | null) => void
  onLocationUpdate: (location: string) => void
}

interface WeatherData {
  temp: number | null
  feelsLike: number | null
  humidity: number | null
  windSpeed: number | null
  condition: string | null
  description: string | null
}

interface ForecastItem {
  date: string
  minTemp: number | null
  maxTemp: number | null
  condition: string | null
}

interface HourlyItem {
  time: string | null
  temp: number | null
}

interface Pollutants {
  [key: string]: number
}

const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function CurrentLocationAQI({ onAQIUpdate, onLocationUpdate }: CurrentLocationAQIProps) {
  const [aqi, setAQI] = useState<number | null>(null)
  const [location, setLocation] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [details, setDetails] = useState<Pollutants | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<HourlyItem[]>([])
  const [dailyForecast, setDailyForecast] = useState<ForecastItem[]>([])
  const [clock, setClock] = useState<Date | null>(null)

  useEffect(() => {
    setClock(new Date())
    const timer = setInterval(() => setClock(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const fetchAQI = async (lat: number, lon: number) => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(`/api/aqi?lat=${lat}&lon=${lon}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch AQI data from API route")
      }

      const data = await response.json()
      const aqiValue = data.aqi

      if (aqiValue === undefined) {
        throw new Error("Invalid AQI data received (AQI value missing).")
      }

      setAQI(aqiValue)
      onAQIUpdate(aqiValue)
      setDetails(data.components ?? null)
      setWeather(data.weather ?? null)
      setHourlyForecast(Array.isArray(data.forecastHourly) ? data.forecastHourly : [])
      setDailyForecast(Array.isArray(data.forecastDaily) ? data.forecastDaily : [])

      try {
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          const address = geoData.address || {}
          const locationName =
            address.city ||
            address.town ||
            address.municipality ||
            address.city_district ||
            address.suburb ||
            address.county ||
            address.state_district ||
            address.state ||
            "Your Location"
          setLocation(locationName)
          onLocationUpdate(locationName)
        } else {
          const fallback = `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`
          setLocation(fallback)
          onLocationUpdate(fallback)
        }
      } catch {
        const fallback = `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`
        setLocation(fallback)
        onLocationUpdate(fallback)
      }
    } catch (err: any) {
      setError(err.message || "Unable to fetch AQI data. Please try again.")
      setWeather(null)
      setHourlyForecast([])
      setDailyForecast([])
      onAQIUpdate(null)
      console.warn("Frontend Fetch Warning:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false)
      setAQI(null)
      onAQIUpdate(null)
      setError("Geolocation is not supported in this browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchAQI(position.coords.latitude, position.coords.longitude)
      },
      () => {
        setLoading(false)
        setAQI(null)
        onAQIUpdate(null)
        setError("Location access denied. Please allow location permission and refresh.")
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    )
  }, [])

  const hourlyTemps = useMemo(() => {
    const values = hourlyForecast.map((h) => h.temp).filter((v) => Number.isFinite(v)) as number[]
    if (!values.length) return { min: 0, max: 1 }
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [hourlyForecast])

  const chartHeight = (temp: number | null) => {
    if (!Number.isFinite(temp)) return 18
    const range = hourlyTemps.max - hourlyTemps.min || 1
    const ratio = (temp - hourlyTemps.min) / range
    return Math.max(18, Math.round(18 + ratio * 72))
  }

  const nowTime = clock ? clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"
  const nowDate = clock
    ? clock.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" })
    : ""

  return (
    <section className="rounded-[28px] bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 p-3 shadow-2xl">
      <div className="grid gap-3 lg:grid-cols-[2.1fr_1fr]">
        <div className="space-y-3 rounded-[24px] bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-4 text-white">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-blue-100">Good day</p>
                <h2 className="text-xl font-semibold text-white">{location || "Detecting location..."}</h2>
                <p className="text-xs text-blue-100/80">{nowDate}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-bold leading-none">{nowTime}</p>
                <p className="mt-2 text-sm text-blue-100">{weather?.description || "Live weather + AQI insights"}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">
                  {weather?.temp !== null && weather?.temp !== undefined ? `${Math.round(weather.temp)}C` : "N/A"}
                </p>
                <p className="text-sm text-blue-100">{weather?.condition || "Weather"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-blue-100">Hourly Forecast</p>
              <span className="text-xs text-blue-100/80">Next 24h</span>
            </div>
            <div className="grid grid-cols-8 items-end gap-2">
              {hourlyForecast.slice(0, 8).map((hour, idx) => (
                <div key={`${hour.time ?? "t"}-${idx}`} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-cyan-300 to-blue-200/80"
                    style={{ height: `${chartHeight(hour.temp)}px` }}
                  />
                  <p className="text-[10px] text-blue-100/80">{hour.time || "--:--"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
              <p className="text-xs text-blue-100/80">Feels Like</p>
              <p className="mt-1 text-xl font-semibold">{weather?.feelsLike !== null && weather?.feelsLike !== undefined ? `${Math.round(weather.feelsLike)}C` : "N/A"}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
              <p className="text-xs text-blue-100/80">Humidity</p>
              <p className="mt-1 text-xl font-semibold">{weather?.humidity !== null && weather?.humidity !== undefined ? `${weather.humidity}%` : "N/A"}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
              <p className="text-xs text-blue-100/80">PM2.5</p>
              <p className="mt-1 text-xl font-semibold">{details?.pm2_5 !== undefined ? `${details.pm2_5.toFixed(1)} ug/m3` : "N/A"}</p>
            </div>
          </div>
        </div>

        <aside className="rounded-[24px] bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-950 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-blue-100">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{location || "Location"}</span>
            </div>
            <AQIBadge aqi={aqi} size="small" />
          </div>
          <p className="mt-2 text-[11px] text-blue-100/80">AQI shown in US scale (0-500): lower is better.</p>

          <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-blue-100/80">Current</p>
            <p className="mt-2 text-3xl font-bold">
              {weather?.temp !== null && weather?.temp !== undefined ? `${Math.round(weather.temp)}C` : "N/A"}
            </p>
            <p className="text-sm text-blue-100">{weather?.condition || "Weather"}</p>
            <div className="mt-4 space-y-2 text-xs text-blue-100/90">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1"><Wind className="h-3.5 w-3.5" /> Wind</span>
                <span>{weather?.windSpeed !== null && weather?.windSpeed !== undefined ? `${weather.windSpeed} m/s` : "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1"><Droplets className="h-3.5 w-3.5" /> Humidity</span>
                <span>{weather?.humidity !== null && weather?.humidity !== undefined ? `${weather.humidity}%` : "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1"><Thermometer className="h-3.5 w-3.5" /> Feels</span>
                <span>{weather?.feelsLike !== null && weather?.feelsLike !== undefined ? `${Math.round(weather.feelsLike)}C` : "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-blue-100">Weather Forecast</p>
            <div className="space-y-2">
              {dailyForecast.slice(0, 5).map((day) => {
                const dayDate = new Date(`${day.date}T00:00:00`)
                const label = `${weekday[dayDate.getDay()]}, ${dayDate.getDate()}`
                return (
                  <div key={day.date} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium">{label}</p>
                        <p className="text-[11px] text-blue-100/80">{day.condition || "Weather"}</p>
                      </div>
                      <p className="text-xs font-semibold">
                        {day.minTemp !== null && day.maxTemp !== null ? `${Math.round(day.minTemp)}C / ${Math.round(day.maxTemp)}C` : "N/A"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>

      {loading && (
        <div className="mt-3 flex items-center justify-center rounded-2xl bg-white/70 py-6 text-slate-700">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </section>
  )
}
