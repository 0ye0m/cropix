"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion"
import { Cloud, Thermometer, Droplets, MapPin } from "lucide-react"

export default function WeatherForecastPage() {
  const [location, setLocation] = useState("")
  const [days, setDays] = useState(7) // Default to 7 days
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setLocation(e.target.value)
  }

  const handleDaysChange = (e) => {
    setDays(e.target.value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setWeatherData(null)

    try {
      const response = await fetch("https://yamxxx1-BackendCropix.hf.space/weather_forecast/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ city: location, days: parseInt(days) }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setWeatherData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Weather Forecast</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay informed with real-time weather predictions to make better farming decisions.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-8">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
              Location (City)
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="location"
              type="text"
              name="location"
              value={location}
              onChange={handleChange}
              placeholder="Enter city name (e.g., London)"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="days">
              Number of Days
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="days"
              type="number"
              name="days"
              value={days}
              onChange={handleDaysChange}
              min="1"
              max="14"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              disabled={loading}
            >
              {loading ? "Fetching..." : "Get Weather Forecast"}
            </button>
          </div>
        </form>

        {loading && <p className="text-blue-500">Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}


        {weatherData && weatherData.forecast && weatherData.forecast.length > 0 && (
          <div className="grid grid-cols-1 gap-8">
            <motion.div
              className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Temperature Forecast</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={weatherData.forecast}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="min_temp_c" stroke="#8884d8" name="Min Temp (°C)" />
                  <Line type="monotone" dataKey="max_temp_c" stroke="#82ca9d" name="Max Temp (°C)" />
                  <Line type="monotone" dataKey="avg_temp_c" stroke="#ffc658" name="Avg Temp (°C)" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
            {/* Current Weather Card */}
            <motion.div
              className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center mb-6">
                <Cloud className="w-8 h-8 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Current Weather in {weatherData.city_name}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <motion.div
                  className="bg-blue-50 p-4 rounded-lg text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Thermometer className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="text-xl font-bold text-blue-600">{weatherData.forecast[0].avg_temp_c}°C</p>
                </motion.div>

                <motion.div
                  className="bg-green-50 p-4 rounded-lg text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Droplets className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Humidity</p>
                  <p className="text-xl font-bold text-green-600">{weatherData.forecast[0].avg_humidity}%</p>
                </motion.div>

                <motion.div
                  className="bg-indigo-50 p-4 rounded-lg text-center col-span-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Cloud className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Condition</p>
                  <p className="text-xl font-bold text-indigo-600">{weatherData.forecast[0].condition}</p>
                </motion.div>
              </div>

              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Farming Tip:</strong> Adjust irrigation based on humidity and rainfall. Protect crops from strong winds if necessary.
                </p>
              </div>
            </motion.div>

            {/* Weather Forecast Card */}
            <motion.div
              className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center mb-6">
                <Cloud className="w-8 h-8 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">7-Day Weather Forecast for {weatherData.city_name}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weatherData.forecast.map((day, index) => (
                  <motion.div
                    key={index}
                    className="bg-blue-50 p-4 rounded-lg text-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="text-lg font-bold text-blue-800 mb-2">{day.date}</p>
                    <Thermometer className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Temp: {day.min_temp_c}°C - {day.max_temp_c}°C</p>
                    <p className="text-sm text-gray-600">Avg Temp: {day.avg_temp_c}°C</p>
                    <Droplets className="w-6 h-6 text-green-600 mx-auto mt-2 mb-1" />
                    <p className="text-sm text-gray-600">Humidity: {day.avg_humidity}%</p>
                    <Cloud className="w-6 h-6 text-indigo-600 mx-auto mt-2 mb-1" />
                    <p className="text-sm text-gray-600">Condition: {day.condition}</p>
                    <p className="text-sm text-gray-600">Chance of Rain: {day.chance_of_rain}%</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Farming Tip:</strong> Adjust irrigation based on humidity and rainfall. Protect crops from strong winds if necessary.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  )
}