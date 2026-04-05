// app/api/aqi/route.ts

import { NextResponse } from 'next/server';

type Pollutant = 'pm2_5' | 'pm10';

interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

const PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
  { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
];

const PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
  { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
  { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
  { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
  { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
  { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
  { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 },
];

function roundForPollutant(value: number, pollutant: Pollutant): number {
  if (pollutant === 'pm2_5') return Math.floor(value * 10) / 10;
  return Math.floor(value);
}

function calculateSubIndex(concentration: number, pollutant: Pollutant): number | null {
  if (!Number.isFinite(concentration) || concentration < 0) return null;

  const rounded = roundForPollutant(concentration, pollutant);
  const breakpoints = pollutant === 'pm2_5' ? PM25_BREAKPOINTS : PM10_BREAKPOINTS;
  const bp = breakpoints.find((b) => rounded >= b.cLow && rounded <= b.cHigh);
  if (!bp) return 500;

  const subIndex = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (rounded - bp.cLow) + bp.iLow;
  return Math.round(Math.max(0, Math.min(500, subIndex)));
}

function getTomorrowForecast(forecastList: any[] | undefined) {
  if (!Array.isArray(forecastList) || forecastList.length === 0) {
    return null;
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowDay = tomorrow.getDate();
  const tomorrowMonth = tomorrow.getMonth();
  const tomorrowYear = tomorrow.getFullYear();

  const tomorrowItems = forecastList.filter((item) => {
    const dt = new Date((item?.dt ?? 0) * 1000);
    return (
      dt.getDate() === tomorrowDay &&
      dt.getMonth() === tomorrowMonth &&
      dt.getFullYear() === tomorrowYear
    );
  });

  if (tomorrowItems.length === 0) {
    return null;
  }

  const temps = tomorrowItems
    .map((item) => item?.main?.temp)
    .filter((temp) => Number.isFinite(temp));

  const noonCandidate =
    tomorrowItems.find((item) => String(item?.dt_txt ?? '').includes('12:00:00')) ||
    tomorrowItems[Math.floor(tomorrowItems.length / 2)];

  const minTemp = temps.length > 0 ? Math.min(...temps) : null;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : null;

  return {
    date: tomorrow.toISOString().split('T')[0],
    minTemp,
    maxTemp,
    condition: noonCandidate?.weather?.[0]?.main ?? null,
    description: noonCandidate?.weather?.[0]?.description ?? null,
    icon: noonCandidate?.weather?.[0]?.icon ?? null,
  };
}

function getHourlyForecast(forecastList: any[] | undefined, count = 8) {
  if (!Array.isArray(forecastList) || forecastList.length === 0) {
    return [];
  }

  return forecastList.slice(0, count).map((item) => ({
    time: String(item?.dt_txt ?? '').split(' ')[1]?.slice(0, 5) || null,
    temp: Number.isFinite(item?.main?.temp) ? item.main.temp : null,
    condition: item?.weather?.[0]?.main ?? null,
    icon: item?.weather?.[0]?.icon ?? null,
  }));
}

function getDailyForecast(forecastList: any[] | undefined, days = 4) {
  if (!Array.isArray(forecastList) || forecastList.length === 0) {
    return [];
  }

  const grouped = new Map<string, any[]>();
  for (const item of forecastList) {
    const dt = new Date((item?.dt ?? 0) * 1000);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const existing = grouped.get(key) ?? [];
    existing.push(item);
    grouped.set(key, existing);
  }

  const result = Array.from(grouped.entries())
    .slice(0, days)
    .map(([date, items]) => {
      const temps = items.map((i) => i?.main?.temp).filter((t) => Number.isFinite(t));
      const noon = items.find((i) => String(i?.dt_txt ?? '').includes('12:00:00')) ?? items[0];
      return {
        date,
        minTemp: temps.length ? Math.min(...temps) : null,
        maxTemp: temps.length ? Math.max(...temps) : null,
        condition: noon?.weather?.[0]?.main ?? null,
        description: noon?.weather?.[0]?.description ?? null,
        icon: noon?.weather?.[0]?.icon ?? null,
      };
    });

  return result;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  // 1. Retrieve the API Key from the environment
  const OWM_KEY = process.env.OPENWEATHER_API_KEY;

  if (!OWM_KEY) {
      // 🚨 Error: Key not loaded (Did you restart the server?)
      console.error("OpenWeatherMap API Key is missing. Check .env.local.");
      return NextResponse.json({ error: 'Server configuration error: API Key missing.' }, { status: 500 });
  }

  if (!lat || !lon) {
      // 🚨 Error: Geolocation data missing from frontend
      return NextResponse.json({ error: 'Latitude and Longitude parameters are missing from the request.' }, { status: 400 });
  }

  // 2. Construct OpenWeatherMap API URLs.
  const OWM_AIR_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`;
  const OWM_WEATHER_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`;
  const OWM_FORECAST_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`;

  try {
    const [airRes, weatherRes, forecastRes] = await Promise.all([
      fetch(OWM_AIR_URL),
      fetch(OWM_WEATHER_URL),
      fetch(OWM_FORECAST_URL),
    ]);

    // Check for network or authentication errors from OpenWeatherMap
    if (!airRes.ok) {
      const errorText = await airRes.text();
      console.error('OpenWeatherMap Air Pollution Request Failed:', airRes.status, errorText);
      
      let errorMessage = `Air pollution API request failed with status: ${airRes.status}.`;
      if (airRes.status === 401) {
          errorMessage = "Authentication failed. Check your OpenWeatherMap API Key for validity.";
      }
      return NextResponse.json(
        { error: errorMessage }, 
        { status: airRes.status }
      );
    }

    const data = await airRes.json();

    const components = data.list?.[0]?.components;
    const pm25Aqi = calculateSubIndex(components?.pm2_5, 'pm2_5');
    const pm10Aqi = calculateSubIndex(components?.pm10, 'pm10');

    if (pm25Aqi === null && pm10Aqi === null) {
      return NextResponse.json({ error: 'PM2.5 and PM10 values not found in OpenWeatherMap response.' }, { status: 500 });
    }

    const aqiValue = Math.max(pm25Aqi ?? 0, pm10Aqi ?? 0);

    let currentWeather: {
      temp: number | null;
      feelsLike: number | null;
      humidity: number | null;
      windSpeed: number | null;
      condition: string | null;
      description: string | null;
      icon: string | null;
    } | null = null;

    if (weatherRes.ok) {
      const weatherData = await weatherRes.json();
      currentWeather = {
        temp: Number.isFinite(weatherData?.main?.temp) ? weatherData.main.temp : null,
        feelsLike: Number.isFinite(weatherData?.main?.feels_like) ? weatherData.main.feels_like : null,
        humidity: Number.isFinite(weatherData?.main?.humidity) ? weatherData.main.humidity : null,
        windSpeed: Number.isFinite(weatherData?.wind?.speed) ? weatherData.wind.speed : null,
        condition: weatherData?.weather?.[0]?.main ?? null,
        description: weatherData?.weather?.[0]?.description ?? null,
        icon: weatherData?.weather?.[0]?.icon ?? null,
      };
    } else {
      const weatherError = await weatherRes.text();
      console.error('OpenWeatherMap Current Weather Request Failed:', weatherRes.status, weatherError);
    }

    let tomorrowForecast: ReturnType<typeof getTomorrowForecast> = null;
    let hourlyForecast: ReturnType<typeof getHourlyForecast> = [];
    let dailyForecast: ReturnType<typeof getDailyForecast> = [];
    if (forecastRes.ok) {
      const forecastData = await forecastRes.json();
      tomorrowForecast = getTomorrowForecast(forecastData?.list);
      hourlyForecast = getHourlyForecast(forecastData?.list);
      dailyForecast = getDailyForecast(forecastData?.list);
    } else {
      const forecastError = await forecastRes.text();
      console.error('OpenWeatherMap Forecast Request Failed:', forecastRes.status, forecastError);
    }

    // 4. Return the data to your frontend
    // AQI is now returned as US AQI (0-500).
    return NextResponse.json({
        aqi: aqiValue,
        // You can return the full components data too, if needed by the frontend
        components,
        weather: currentWeather,
        forecastTomorrow: tomorrowForecast,
        forecastHourly: hourlyForecast,
        forecastDaily: dailyForecast,
    });

  } catch (error) {
    console.error('API Route Execution Error:', error);
    return NextResponse.json({ error: 'An unexpected server error occurred during data fetch.' }, { status: 500 });
  }
}
