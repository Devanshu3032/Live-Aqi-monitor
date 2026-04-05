"use client"

import { useState } from "react"
import CurrentLocationAQI from "@/components/current-location-aqi"
import MajorCitiesAQI from "@/components/major-cities-aqi"
import SafetyTips from "@/components/safety-tips"
import Header from "@/components/header"

export default function Home() {
  const [currentAQI, setCurrentAQI] = useState<number | null>(null)
  const [, setLocation] = useState<string>("")

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#51608a_0%,#3e4463_30%,#24293f_55%,#1a1d2f_100%)]">
      <Header />

      <div className="container mx-auto max-w-6xl px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CurrentLocationAQI onAQIUpdate={setCurrentAQI} onLocationUpdate={setLocation} />
          </div>

          <div>
            <SafetyTips aqi={currentAQI} />
          </div>
        </div>

        <div className="mt-8">
          <MajorCitiesAQI />
        </div>
      </div>
    </main>
  )
}
