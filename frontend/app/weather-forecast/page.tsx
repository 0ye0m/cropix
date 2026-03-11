"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { motion } from "framer-motion"
import { Cloud, Thermometer, Droplets, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// --- API CONFIGURATION ---
const GROQ_API_KEYS = [
  "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",
  "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"
]
const MODEL_ID = "llama-3.1-8b-instant"

// --- TYPES ---
interface ForecastDay {
  date: string;
  max_temp_c: number;
  min_temp_c: number;
  avg_temp_c: number;
  avg_humidity: number;
  condition: string;
  chance_of_rain: number;
}

interface WeatherData {
  city_name: string;
  forecast: ForecastDay[];
}

export default function WeatherForecastPage() {
  const [location, setLocation] = useState<string>("")
  const [days, setDays] = useState<number>(6)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [aiInsight, setAiInsight] = useState<string>("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value)
  }

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDays = parseInt(e.target.value)
    if (newDays > 6) {
      setDays(6)
      setWarning("Only a 6-day forecast is available. Displaying 6 days.")
    } else if (newDays < 1) {
      setDays(1)
    } else {
      setDays(newDays)
      setWarning(null)
    }
  }

  // --- GROQ API INTEGRATION ---
  const getAIInsight = async (data: WeatherData) => {
    let lastError: Error | null = null;
    const prompt = `
      Act as an expert agricultural meteorologist. Analyze the following ${data.forecast.length}-day weather forecast for ${data.city_name}.
      Data: ${JSON.stringify(data.forecast)}
      
      Task: Provide a concise agricultural insight (3-4 sentences). 
      1. Validate if the weather conditions are suitable for typical farming activities.
      2. Warn about any extreme conditions (heavy rain, extreme heat).
      3. Suggest specific actions (e.g., "delay irrigation", "watch for fungal diseases due to high humidity").
      
      Do not add greetings. Return only the insight text.
    `;

    for (const key of GROQ_API_KEYS) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: MODEL_ID, messages: [{ role: "user", content: prompt }], temperature: 0.5 })
        });
        if (res.ok) {
          const json = await res.json();
          setAiInsight(json.choices[0].message.content);
          return;
        }
      } catch (err) {
        lastError = err as Error;
      }
    }
    setAiInsight("Could not generate AI insight at this moment.");
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setWeatherData(null)
    setAiInsight("")
    setWarning(null)

    const daysToSend = days > 6 ? 6 : days

    try {
      const response = await fetch("https://yamxxx1-BackendCropix.hf.space/weather_forecast/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: location, days: daysToSend }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data: WeatherData = await response.json()
      
      // Validation Logic
      if (!data.forecast || data.forecast.length === 0) {
        throw new Error("No forecast data received for this location.")
      }
      
      if (data.forecast.length !== daysToSend) {
        setWarning(`Note: API returned data for ${data.forecast.length} days instead of requested ${daysToSend}.`)
      }

      setWeatherData(data)
      // Trigger AI Analysis
      getAIInsight(data)

    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Weather Forecast</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time weather predictions powered by AI analysis.
          </p>
        </motion.div>

        <Card className="border-border shadow-lg mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="location">Location (City)</Label>
                  <Input
                    id="location"
                    type="text"
                    value={location}
                    onChange={handleChange}
                    placeholder="e.g., Nagpur"
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Number of Days</Label>
                  <Input
                    id="days"
                    type="number"
                    value={days}
                    onChange={handleDaysChange}
                    min="1"
                    max="6"
                    required
                    className="bg-input border-border"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full md:w-auto bg-primary hover:bg-primary/90 h-10">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching...</> : "Get Forecast"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {warning && <p className="text-yellow-600 dark:text-yellow-400 text-center mb-4 text-sm">{warning}</p>}
        {error && <p className="text-destructive text-center mb-4">Error: {error}</p>}

        {weatherData && (
          <div className="grid grid-cols-1 gap-8">
            {/* Temperature Chart */}
            <motion.div
              className="bg-card rounded-2xl shadow-lg border border-border p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-foreground mb-4 text-center">Temperature Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weatherData.forecast} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="min_temp_c" stroke="#8884d8" name="Min Temp (°C)" strokeWidth={2} />
                  <Line type="monotone" dataKey="max_temp_c" stroke="#82ca9d" name="Max Temp (°C)" strokeWidth={2} />
                  <Line type="monotone" dataKey="avg_temp_c" stroke="#ffc658" name="Avg Temp (°C)" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* AI Insight Card */}
            {aiInsight && (
              <motion.div
                className="bg-primary/10 border border-primary/30 rounded-lg p-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                <div className="flex items-start gap-3">
                  <Cloud className="w-6 h-6 text-primary mt-1 shrink-0" />
                  <div>
                    <h3 className="font-bold text-primary mb-1">AI Agricultural Insight</h3>
                    <p className="text-sm text-foreground/80">{aiInsight}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Forecast Cards */}
            <motion.div
              className="bg-card rounded-2xl shadow-lg border border-border p-6"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center mb-6">
                <Cloud className="w-6 h-6 text-primary mr-3" />
                <h2 className="text-xl font-bold text-foreground">{weatherData.forecast.length}-Day Forecast for {weatherData.city_name}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {weatherData.forecast.map((day, index) => (
                  <motion.div
                    key={index}
                    className="bg-muted/50 border border-border p-4 rounded-lg text-center"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-md font-bold text-foreground mb-2">{day.date}</p>
                    <div className="flex justify-center gap-4 text-sm mb-2">
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-4 h-4 text-blue-500" />
                        <span>{day.avg_temp_c}°C</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="w-4 h-4 text-cyan-500" />
                        <span>{day.avg_humidity}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{day.condition}</p>
                    <p className="text-xs text-muted-foreground mt-1">Rain: {day.chance_of_rain}%</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  )
}