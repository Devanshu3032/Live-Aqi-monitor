"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Heart, Wind, Eye } from "lucide-react"

interface SafetyTipsProps {
  aqi: number | null
}

export default function SafetyTips({ aqi }: SafetyTipsProps) {
  const getSafetyTips = (value: number | null) => {
    if (value === null) {
      return {
        level: "Loading",
        tips: ["Detecting your location..."],
        icon: AlertCircle,
        color: "text-slate-300",
      }
    }

    if (value <= 50) {
      return {
        level: "Good",
        tips: [
          "✓ Air quality is satisfactory",
          "✓ Enjoy outdoor activities freely",
          "✓ No restrictions for any group",
          "✓ Perfect time for exercise",
        ],
        icon: Heart,
        color: "text-emerald-300",
      }
    }

    if (value <= 100) {
      return {
        level: "Moderate",
        tips: [
          "⚠ Air quality is acceptable",
          "⚠ Unusually sensitive people should limit outdoor activities",
          "⚠ Consider wearing a mask if sensitive",
          "⚠ Keep windows closed during peak hours",
        ],
        icon: Wind,
        color: "text-yellow-300",
      }
    }

    if (value <= 150) {
      return {
        level: "Unhealthy for Sensitive Groups",
        tips: [
          "⚠ Sensitive groups should limit outdoor activities",
          "⚠ Wear N95 masks when going outside",
          "⚠ Keep indoor air clean with air purifiers",
          "⚠ Avoid strenuous outdoor exercise",
          "⚠ Increase water intake",
        ],
        icon: Eye,
        color: "text-orange-300",
      }
    }

    if (value <= 200) {
      return {
        level: "Unhealthy",
        tips: [
          "🚨 Everyone should limit outdoor activities",
          "🚨 Wear N95 masks when outside",
          "🚨 Use air purifiers indoors",
          "🚨 Avoid outdoor exercise",
          "🚨 Keep children and elderly indoors",
          "🚨 Consult doctor if experiencing symptoms",
        ],
        icon: AlertCircle,
        color: "text-red-300",
      }
    }

    if (value <= 300) {
      return {
        level: "Very Unhealthy",
        tips: [
          "🚨 Avoid all outdoor activities",
          "🚨 Wear N95/N99 masks if must go out",
          "🚨 Keep all windows and doors closed",
          "🚨 Use air purifiers continuously",
          "🚨 Keep vulnerable groups indoors",
          "🚨 Seek medical help if symptoms worsen",
        ],
        icon: AlertCircle,
        color: "text-fuchsia-300",
      }
    }

    return {
      level: "Hazardous",
      tips: [
        "🚨 Stay indoors completely",
        "🚨 Seal all windows and doors",
        "🚨 Use air purifiers with HEPA filters",
        "🚨 Wear N99 masks if emergency exit needed",
        "🚨 Seek immediate medical help if symptoms occur",
        "🚨 Consider relocating temporarily",
      ],
      icon: AlertCircle,
      color: "text-rose-300",
    }
  }

  const safetyInfo = getSafetyTips(aqi)
  const IconComponent = safetyInfo.icon

  return (
    <Card className="h-full border border-white/15 bg-white/10 text-slate-100 shadow-2xl backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconComponent className={`w-5 h-5 ${safetyInfo.color}`} />
          <div>
            <CardTitle className="text-slate-50">Safety Recommendations</CardTitle>
            <CardDescription className={safetyInfo.color}>{safetyInfo.level}</CardDescription>
            <CardDescription className="text-slate-300">Based on US AQI scale (0-500)</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {safetyInfo.tips.map((tip, index) => (
            <li key={index} className="text-sm text-slate-100 leading-relaxed">
              {tip}
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-lg border border-white/10 bg-white/10 p-4">
          <p className="text-xs text-slate-300">
            <strong>Note:</strong> These recommendations are based on AQI levels. For medical concerns, consult a
            healthcare professional.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
