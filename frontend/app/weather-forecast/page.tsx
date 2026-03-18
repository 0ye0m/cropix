"use client"

import { useState, useEffect } from "react"
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
import { motion, AnimatePresence } from "framer-motion"
import { Cloud, Thermometer, Droplets, Loader2, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// --- API CONFIGURATION (⚠️ SECURITY WARNING: These keys are exposed in the browser!
// Anyone can steal them. You MUST move this logic to a backend API route.
// See: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// ---
const GROQ_API_KEYS = [
  "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",
  "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"
]
const MODEL_ID = "llama-3.1-8b-instant"

// --- CROP KNOWLEDGE BASE (thresholds & alerts) ---
interface CropRule {
  condition: (day: ForecastDay) => boolean;
  message: string;
}

const CROP_THRESHOLDS: Record<string, Record<string, CropRule[]>> = {
  wheat: {
    germination: [
      { condition: (day) => day.max_temp_c > 30, message: "High temperature during germination may reduce emergence. Consider light irrigation to cool soil." },
      { condition: (day) => day.min_temp_c < 5, message: "Low temperature during germination can delay emergence. Protect with mulch if possible." },
      { condition: (day) => day.chance_of_rain > 70, message: "Heavy rain expected during germination – waterlogging risk. Ensure drainage." }
    ],
    vegetative: [
      { condition: (day) => day.max_temp_c > 35, message: "Heat stress during vegetative growth. Irrigate to maintain soil moisture." },
      { condition: (day) => day.avg_humidity > 80, message: "High humidity may promote foliar diseases. Monitor for rust or mildew." }
    ],
    flowering: [
      { condition: (day) => day.max_temp_c > 32, message: "High temperature during flowering can reduce pollination. Provide shade or irrigation." },
      { condition: (day) => day.chance_of_rain > 60, message: "Rain during flowering may wash away pollen. Consider covering if feasible." }
    ],
    "grain filling": [
      { condition: (day) => day.max_temp_c > 35, message: "Extreme heat during grain filling reduces yield. Irrigate to reduce stress." },
      { condition: (day) => day.min_temp_c < 12, message: "Cool nights during grain filling slow down grain development." }
    ],
    maturity: [
      { condition: (day) => day.chance_of_rain > 50, message: "Rain near maturity may cause lodging or grain sprouting. Plan harvest accordingly." }
    ]
  },
  rice: {
    germination: [
      { condition: (day) => day.min_temp_c < 15, message: "Low temperature slows rice germination. Maintain shallow water layer." },
      { condition: (day) => day.max_temp_c > 38, message: "Very high temperature may inhibit germination. Provide light irrigation." }
    ],
    vegetative: [
      { condition: (day) => day.max_temp_c > 36, message: "Heat stress in vegetative stage. Keep field flooded to cool plants." },
      { condition: (day) => day.avg_humidity < 50, message: "Low humidity may increase pest incidence. Monitor for planthoppers." }
    ],
    flowering: [
      { condition: (day) => day.max_temp_c > 35, message: "High temperature during flowering causes spikelet sterility. Maintain water depth." },
      { condition: (day) => day.chance_of_rain > 70, message: "Heavy rain during flowering can damage panicles. Ensure good drainage." }
    ],
    "grain filling": [
      { condition: (day) => day.min_temp_c < 18, message: "Cool nights during grain filling reduce grain weight." }
    ],
    maturity: []
  },
  maize: {
    germination: [
      { condition: (day) => day.min_temp_c < 10, message: "Cold soil delays maize germination. Consider postponing planting." }
    ],
    vegetative: [
      { condition: (day) => day.max_temp_c > 38, message: "Extreme heat during vegetative stage – provide irrigation to avoid wilting." }
    ],
    flowering: [
      { condition: (day) => day.max_temp_c > 36, message: "Heat stress during silking can reduce pollination. Irrigate to cool canopy." },
      { condition: (day) => day.chance_of_rain > 60, message: "Rain during flowering may interfere with pollination." }
    ],
    "grain filling": [
      { condition: (day) => day.max_temp_c > 35, message: "High temperature during grain fill reduces kernel weight." }
    ],
    maturity: []
  },
  cotton: {
    germination: [
      { condition: (day) => day.min_temp_c < 14, message: "Low temperature delays cotton germination. Wait for warmer conditions." }
    ],
    vegetative: [
      { condition: (day) => day.max_temp_c > 40, message: "Extreme heat may cause square shedding. Increase irrigation frequency." }
    ],
    flowering: [
      { condition: (day) => day.chance_of_rain > 50, message: "Rain during flowering can cause boll rot. Monitor fields." }
    ],
    "boll development": [
      { condition: (day) => day.max_temp_c > 38, message: "Heat stress during boll development reduces lint quality." }
    ],
    maturity: []
  }
};

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

  // New state for crop advisories
  const [selectedCrop, setSelectedCrop] = useState<string>("")
  const [selectedStage, setSelectedStage] = useState<string>("")
  const [cropAlerts, setCropAlerts] = useState<string[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value)
  }

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // If the input is cleared, fallback to 1
    if (rawValue === '') {
      setDays(1);
      setWarning(null);
      return;
    }

    const newDays = parseInt(rawValue, 10);

    // If parsing fails, fallback to 1
    if (isNaN(newDays)) {
      setDays(1);
      setWarning(null);
      return;
    }

    // Apply min/max limits
    if (newDays > 6) {
      setDays(6);
      setWarning("Only a 6-day forecast is available. Displaying 6 days.");
    } else if (newDays < 1) {
      setDays(1);
      setWarning(null);
    } else {
      setDays(newDays);
      setWarning(null);
    }
  };

  // --- CROP ALERT GENERATION ---
  useEffect(() => {
    let isMounted = true;

    if (!weatherData || !selectedCrop || !selectedStage) {
      setCropAlerts([]);
      return;
    }

    const rules = CROP_THRESHOLDS[selectedCrop]?.[selectedStage];
    if (!rules || rules.length === 0) {
      setCropAlerts([]);
      return;
    }

    const alerts: string[] = [];
    weatherData.forecast.forEach(day => {
      rules.forEach(rule => {
        if (rule.condition(day)) {
          const msg = `[${day.date}] ${rule.message}`;
          if (!alerts.includes(msg)) alerts.push(msg);
        }
      });
    });

    if (isMounted) setCropAlerts(alerts);

    return () => { isMounted = false; };
  }, [weatherData, selectedCrop, selectedStage]);

  // --- GROQ API INTEGRATION (enhanced with crop info) ---
  const getAIInsight = async (data: WeatherData) => {
    let lastError: Error | null = null;
    const cropContext = selectedCrop && selectedStage
      ? `The user is interested in ${selectedCrop} at the ${selectedStage} stage.`
      : "The user has not specified a crop.";

    const prompt = `
      Act as an expert agricultural meteorologist. Analyze the following ${data.forecast.length}-day weather forecast for ${data.city_name}.
      Data: ${JSON.stringify(data.forecast)}
      
      ${cropContext}
      
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
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setWeatherData(null)
    setAiInsight("")
    setWarning(null)
    setCropAlerts([])

    const daysToSend = days > 6 ? 6 : days

    try {
      const response = await fetch("https://yamxxx1-BackendCropix.hf.space/weather_forecast/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: location, days: daysToSend }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data: WeatherData = await response.json()
      
      if (!data.forecast || data.forecast.length === 0) {
        throw new Error("No forecast data received for this location.")
      }
      
      if (data.forecast.length !== daysToSend) {
        setWarning(`Note: API returned data for ${data.forecast.length} days instead of requested ${daysToSend}.`)
      }

      setWeatherData(data)
      getAIInsight(data)

    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  };

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
            Real-time weather predictions with crop‑specific advisories.
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
            {/* Crop & Stage Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="crop">Select Crop (optional)</Label>
                <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                  <SelectTrigger id="crop" className="bg-input border-border">
                    <SelectValue placeholder="Choose a crop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wheat">Wheat</SelectItem>
                    <SelectItem value="rice">Rice</SelectItem>
                    <SelectItem value="maize">Maize</SelectItem>
                    <SelectItem value="cotton">Cotton</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stage">Growth Stage</Label>
                <Select value={selectedStage} onValueChange={setSelectedStage} disabled={!selectedCrop}>
                  <SelectTrigger id="stage" className="bg-input border-border">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCrop && Object.keys(CROP_THRESHOLDS[selectedCrop] || {}).map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Crop Alerts Card with AnimatePresence */}
            <AnimatePresence>
              {selectedCrop && selectedStage && (
                <motion.div
                  key="crop-alerts"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-2">
                        Crop Advisory for {selectedCrop} ({selectedStage})
                      </h3>
                      {cropAlerts.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-200 space-y-1">
                          {cropAlerts.map((alert, idx) => <li key={idx}>{alert}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm text-amber-700 dark:text-amber-200">
                          No specific alerts for this crop and stage based on the forecast.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

            {/* AI Insight Card with AnimatePresence */}
            <AnimatePresence>
              {aiInsight && (
                <motion.div
                  key="ai-insight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-primary/10 border border-primary/30 rounded-lg p-4"
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
            </AnimatePresence>

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
                    key={day.date + index} // stable key
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