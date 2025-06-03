"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Calendar,
  Coins,
  Percent,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Share2,
  Maximize,
  Minimize,
  ChevronDown,
  Info,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import AdminLayout from "@/components/admin-layout"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Area,
  AreaChart,
  Brush,
  type TooltipProps,
} from "recharts"
import { API_BASE_URL } from "@/lib/config"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PriceData {
  purchase_price: number
  Date: string
  formattedDate?: string
  formattedTime?: string
  formattedDateTime?: string
  timestamp?: number
}

interface PriceStats {
  price: number
  per_day: { gold: number; percent: number }
  per_week: { gold: number; percent: number }
  per_month: { gold: number; percent: number }
  per_year: { gold: number; percent: number }
}

interface ApiResponse {
  data: PriceData[]
  stats: PriceStats
}

// Time period options for the chart
type TimePeriod = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL"

// Chart type options
type ChartType = "line" | "area" | "candlestick"

export default function ItemStatistics({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const itemName = searchParams.get("name") || "Unknown Item"
  const itemId = params.id
  const chartRef = useRef<any>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  // State for data and UI
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [filteredData, setFilteredData] = useState<PriceData[]>([])
  const [displayData, setDisplayData] = useState<PriceData[]>([])
  const [stats, setStats] = useState<PriceStats | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1M")
  const [chartType, setChartType] = useState<ChartType>("area")
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null)
  const [zoomDomain, setZoomDomain] = useState<{ x: [number, number]; y: [number, number] } | null>(null)
  const [longHoverTimeout, setLongHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [longHoverInfo, setLongHoverInfo] = useState<{ x: number; y: number; data: PriceData | null } | null>(null)
  const [dataPointLimit, setDataPointLimit] = useState(1000000) // Increased limit for better visualization
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [showNoDataMessage, setShowNoDataMessage] = useState(false)

  // Fetch data from API
  const fetchItemStats = useCallback(
    async (showToast = true) => {
      try {
        setIsLoading(true)
        setError(null)
        setShowNoDataMessage(false)
        setRetryCount(0) // сбрасываем счетчик попыток

        // Create an AbortController for the fetch request
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

        // Use the API_BASE_URL from config.ts
        const apiUrl = `${API_BASE_URL}/api/v1/prices?name=${encodeURIComponent(itemName)}`
        console.log("Fetching from:", apiUrl)

        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error")
          console.error(`API Error (${response.status}):`, errorText)
          throw new Error(`API Error: ${response.status}${errorText ? ` - ${errorText}` : ""}`)
        }

        let data: ApiResponse
        try {
          const responseText = await response.text()
          if (!responseText || responseText.trim() === "") {
            throw new Error("Empty response received")
          }
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError)
          throw new Error("Failed to parse API response")
        }

        if (!data || !data.data || !Array.isArray(data.data)) {
          console.error("Invalid data structure:", data)
          throw new Error("Invalid data structure received from API")
        }

        if (data.data.length === 0) {
          setShowNoDataMessage(true)
          // Generate mock data for preview but show a message
          const mockData = generateMockData(itemName)
          setPriceData(mockData.data)
          filterDataByPeriod(mockData.data, selectedPeriod)
          setStats(mockData.stats)

          if (showToast) {
            toast({
              title: "No price data available",
              description: "Using sample data for preview purposes",
              variant: "warning",
            })
          }

          setIsLoading(false)
          setIsRefreshing(false)
          return
        }

        // Ensure stats object has all required properties with default values if missing
        const safeStats: PriceStats = {
          price: data.stats?.price || 0,
          per_day: {
            gold: data.stats?.per_day?.gold || 0,
            percent: data.stats?.per_day?.percent || 0,
          },
          per_week: {
            gold: data.stats?.per_week?.gold || 0,
            percent: data.stats?.per_week?.percent || 0,
          },
          per_month: {
            gold: data.stats?.per_month?.gold || 0,
            percent: data.stats?.per_month?.percent || 0,
          },
          per_year: {
            gold: data.stats?.per_year?.gold || 0,
            percent: data.stats?.per_year?.percent || 0,
          },
        }

        // Process the data to format dates for the chart
        const processedData = data.data
          .map((item) => {
            try {
              const date = new Date(item.Date)
              return {
                ...item,
                formattedDate: date.toLocaleDateString(),
                formattedTime: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                formattedDateTime: `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
                timestamp: date.getTime(), // Add timestamp for easier sorting and filtering
              }
            } catch (e) {
              // Handle invalid dates
              console.error("Invalid date format:", item.Date)
              return {
                ...item,
                formattedDate: "Invalid date",
                formattedTime: "",
                formattedDateTime: "Invalid date",
                timestamp: 0,
              }
            }
          })
          .filter((item) => !isNaN(item.purchase_price)) // Filter out items with invalid prices
          .sort((a, b) => {
            try {
              return (a.timestamp || 0) - (b.timestamp || 0)
            } catch (e) {
              return 0
            }
          })

        if (processedData.length === 0) {
          setShowNoDataMessage(true)
          // Generate mock data for preview but show a message
          const mockData = generateMockData(itemName)
          setPriceData(mockData.data)
          filterDataByPeriod(mockData.data, selectedPeriod)
          setStats(mockData.stats)

          if (showToast) {
            toast({
              title: "No valid price data available",
              description: "Using sample data for preview purposes",
              variant: "warning",
            })
          }
        } else {
          setPriceData(processedData)
          filterDataByPeriod(processedData, selectedPeriod)
          setStats(safeStats)

          if (isRefreshing && showToast) {
            toast({
              title: "Data refreshed",
              description: "The latest price data has been loaded",
            })
          }
        }
      } catch (err: any) {
        console.error("Error fetching item statistics:", err)

        const errorMessage = err.message || "Failed to load item statistics"
        setError(errorMessage)

        if (showToast) {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }

        // Set mock data for development/preview or if API fails
        const mockData = generateMockData(itemName)
        setPriceData(mockData.data)
        filterDataByPeriod(mockData.data, selectedPeriod)
        setStats(mockData.stats)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [itemName, selectedPeriod, toast], // убираем retryCount и isRefreshing из зависимостей
  )

  // Function to optimize data for display
  const optimizeDataForDisplay = useCallback(
    (data: PriceData[]) => {
      if (!data || data.length === 0) return []

      // If data is smaller than limit, return all data
      if (data.length <= dataPointLimit) return data

      // Otherwise, sample the data to reduce points
      const samplingRate = Math.ceil(data.length / dataPointLimit)
      const optimizedData: PriceData[] = []

      // Always include first and last points
      optimizedData.push(data[0])

      // Sample middle points
      for (let i = samplingRate; i < data.length - samplingRate; i += samplingRate) {
        optimizedData.push(data[i])
      }

      // Add last point
      optimizedData.push(data[data.length - 1])

      return optimizedData
    },
    [dataPointLimit],
  )

  const filterDataByPeriod = useCallback(
    (data: PriceData[], period: TimePeriod) => {
      if (!data || data.length === 0) {
        setFilteredData([])
        setDisplayData([])
        return
      }

      const now = new Date()
      const cutoffDate = new Date()

      switch (period) {
        case "1W":
          cutoffDate.setDate(now.getDate() - 7)
          break
        case "1M":
          cutoffDate.setMonth(now.getMonth() - 1)
          break
        case "3M":
          cutoffDate.setMonth(now.getMonth() - 3)
          break
        case "6M":
          cutoffDate.setMonth(now.getMonth() - 6)
          break
        case "1Y":
          cutoffDate.setFullYear(now.getFullYear() - 1)
          break
        case "ALL":
          // No filtering needed
          setFilteredData(data)
          setDisplayData(data)
          // setDisplayData(optimizeDataForDisplay(data))
          return
      }

      try {
        const filtered = data.filter((item) => {
          try {
            return (item.timestamp || new Date(item.Date).getTime()) >= cutoffDate.getTime()
          } catch (e) {
            return false
          }
        })

        const finalData = filtered.length > 0 ? filtered : data
        setFilteredData(finalData)
        setDisplayData(optimizeDataForDisplay(finalData))
      } catch (e) {
        console.error("Error filtering data:", e)
        setFilteredData(data)
        setDisplayData(optimizeDataForDisplay(data))
      }
    },
    [optimizeDataForDisplay],
  )

  // Initial data fetch (только один раз при монтировании)
  useEffect(() => {
    fetchItemStats(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update filtered data when period changes
  useEffect(() => {
    if (priceData.length > 0) {
      filterDataByPeriod(priceData, selectedPeriod)
    }
  }, [selectedPeriod, priceData, filterDataByPeriod])

  // Clear long hover timeout when component unmounts
  useEffect(() => {
    return () => {
      if (longHoverTimeout) {
        clearTimeout(longHoverTimeout)
      }
    }
  }, [longHoverTimeout])

  // Handle fullscreen mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setRetryCount(0)
    fetchItemStats()
  }

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period)
    // Reset zoom when changing period
    setZoomDomain(null)
  }

  const toggleChartType = (type: ChartType) => {
    setChartType(type)
  }

  const handleZoomIn = () => {
    if (!filteredData.length) return

    // If no zoom is set, zoom to middle 50%
    if (!zoomDomain) {
      const dataLength = filteredData.length
      const startIndex = Math.floor(dataLength * 0.25)
      const endIndex = Math.floor(dataLength * 0.75)

      setZoomDomain({
        x: [startIndex, endIndex],
        y: [0, 0], // Y will be auto-calculated by Recharts
      })
    } else {
      // Further zoom in by 25%
      const currentRange = zoomDomain.x[1] - zoomDomain.x[0]
      const newRange = Math.max(10, Math.floor(currentRange * 0.75)) // Ensure at least 10 points
      const midPoint = Math.floor((zoomDomain.x[0] + zoomDomain.x[1]) / 2)
      const halfNewRange = Math.floor(newRange / 2)

      setZoomDomain({
        x: [Math.max(0, midPoint - halfNewRange), Math.min(filteredData.length - 1, midPoint + halfNewRange)],
        y: [0, 0],
      })
    }
  }

  const handleZoomOut = () => {
    if (!filteredData.length || !zoomDomain) return

    // Zoom out by 50%
    const currentRange = zoomDomain.x[1] - zoomDomain.x[0]
    const newRange = Math.min(filteredData.length, Math.floor(currentRange * 2))
    const midPoint = Math.floor((zoomDomain.x[0] + zoomDomain.x[1]) / 2)
    const halfNewRange = Math.floor(newRange / 2)

    const newDomain = {
      x: [Math.max(0, midPoint - halfNewRange), Math.min(filteredData.length - 1, midPoint + halfNewRange)],
      y: [0, 0],
    }

    // If we're zoomed out to almost full view, reset zoom completely
    if (newDomain.x[0] <= 5 && newDomain.x[1] >= filteredData.length - 5) {
      setZoomDomain(null)
    } else {
      setZoomDomain(newDomain)
    }
  }

  const resetZoom = () => {
    setZoomDomain(null)
  }

  // Handle mouse move on chart for long hover detection
  const handleChartMouseMove = (e: any) => {
    if (!e || !e.activeCoordinate) {
      if (longHoverTimeout) {
        clearTimeout(longHoverTimeout)
        setLongHoverTimeout(null)
      }
      return
    }

    // Clear any existing timeout
    if (longHoverTimeout) {
      clearTimeout(longHoverTimeout)
    }

    // Set new timeout for long hover (500ms)
    const timeout = setTimeout(() => {
      if (e.activePayload && e.activePayload.length > 0) {
        setLongHoverInfo({
          x: e.activeCoordinate.x,
          y: e.activeCoordinate.y,
          data: e.activePayload[0].payload,
        })
      }
    }, 500)

    setLongHoverTimeout(timeout)
  }

  const handleChartMouseLeave = () => {
    if (longHoverTimeout) {
      clearTimeout(longHoverTimeout)
      setLongHoverTimeout(null)
    }
    setLongHoverInfo(null)
  }

  const toggleFullscreen = () => {
    if (isFullscreen) {
      document.exitFullscreen()
    } else if (chartContainerRef.current) {
      chartContainerRef.current.requestFullscreen()
    }
  }

  // Export data as CSV
  const exportData = () => {
    if (!filteredData.length) return

    const csvContent = [
      // Header row
      ["Date", "Time", "Price (G)"].join(","),
      // Data rows
      ...filteredData.map((item) => {
        const date = new Date(item.Date)
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          item.purchase_price.toString(),
        ].join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${itemName.replace(/\s+/g, "_")}_price_history.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Share chart data
  const shareData = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${itemName} Price History`,
          text: `Check out the price history for ${itemName}`,
          url: window.location.href,
        })
        .catch((err) => {
          console.error("Error sharing:", err)
        })
    } else {
      // Fallback - copy URL to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({
          title: "Link copied",
          description: "The URL has been copied to your clipboard",
        })
      })
    }
  }

  const generateMockData = (name: string): ApiResponse => {
    const today = new Date()
    const data: PriceData[] = []

    // Use item name to generate a somewhat consistent base price
    const nameSum = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
    const basePrice = 200 + (nameSum % 300)

    // Generate 365 days of mock data for a full year
    for (let i = 365; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // Create a sine wave pattern with some randomness for more realistic data
      const dayFactor = Math.sin(i / 30) * 20
      const randomFactor = Math.sin(i) * 10 + Math.cos(i * 2) * 5

      // Add some trend over time
      const trendFactor = (i / 365) * 50

      const timestamp = date.getTime()

      data.push({
        purchase_price: Number.parseFloat((basePrice + dayFactor + randomFactor + trendFactor).toFixed(2)),
        Date:
          date.toISOString().split("T")[0] +
          " " +
          String(Math.floor(Math.random() * 24)).padStart(2, "0") +
          ":" +
          String(Math.floor(Math.random() * 60)).padStart(2, "0") +
          ":" +
          String(Math.floor(Math.random() * 60)).padStart(2, "0"),
        formattedDate: date.toLocaleDateString(),
        formattedTime: `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        formattedDateTime: `${date.toLocaleDateString()} ${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        timestamp,
      })
    }

    // Calculate realistic stats based on the generated data
    const currentPrice = data[data.length - 1].purchase_price
    const yesterdayPrice = data[data.length - 2]?.purchase_price || currentPrice
    const weekAgoPrice = data[data.length - 7]?.purchase_price || currentPrice
    const monthAgoPrice = data[data.length - 30]?.purchase_price || currentPrice
    const yearAgoPrice = data[0]?.purchase_price || currentPrice

    const dayChange = currentPrice - yesterdayPrice
    const weekChange = currentPrice - weekAgoPrice
    const monthChange = currentPrice - monthAgoPrice
    const yearChange = currentPrice - yearAgoPrice

    return {
      data,
      stats: {
        price: currentPrice,
        per_day: {
          gold: Number(dayChange.toFixed(2)),
          percent: Number(((dayChange / yesterdayPrice) * 100).toFixed(2)),
        },
        per_week: {
          gold: Number(weekChange.toFixed(2)),
          percent: Number(((weekChange / weekAgoPrice) * 100).toFixed(2)),
        },
        per_month: {
          gold: Number(monthChange.toFixed(2)),
          percent: Number(((monthChange / monthAgoPrice) * 100).toFixed(2)),
        },
        per_year: {
          gold: Number(yearChange.toFixed(2)),
          percent: Number(((yearChange / yearAgoPrice) * 100).toFixed(2)),
        },
      },
    }
  }

  const formatGold = (value: number | null | undefined) => {
    // Handle null or undefined values
    if (value === null || value === undefined) {
      return "0.00 G"
    }

    return `${value.toFixed(2)} G`
  }

  const formatPercent = (value: number | null | undefined) => {
    // Handle null or undefined values
    if (value === null || value === undefined) {
      return "0.00%"
    }

    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as PriceData
      const price = payload[0].value as number

      // Update the hovered price state
      if (hoveredPrice !== price) {
        setHoveredPrice(price)
      }

      return (
        <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-md shadow-lg">
          <p className="text-zinc-300 mb-2 font-medium">{data.formattedDateTime || label}</p>
          <div className="flex items-center text-zinc-100 text-lg font-semibold">
            <Coins size={18} className="mr-1" />
            {formatGold(price)}
          </div>

          {stats && (
            <div className="mt-2 pt-2 border-t border-zinc-700">
              <div
                className={`flex items-center text-sm ${price > stats.price ? "text-green-500" : price < stats.price ? "text-red-500" : "text-zinc-400"}`}
              >
                <span>vs Current: </span>
                <span className="ml-1">
                  {formatGold(price - stats.price)} ({(((price - stats.price) / (stats.price || 1)) * 100).toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  const StatCard = ({
    title,
    value,
    change,
    changePercent,
  }: {
    title: string
    value: number | null | undefined
    change: number | null | undefined
    changePercent: number | null | undefined
  }) => {
    // Handle null or undefined values
    const safeValue = value ?? 0
    const safeChange = change ?? 0
    const safeChangePercent = changePercent ?? 0

    const isPositive = safeChange >= 0

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 transition-all hover:border-zinc-700">
        <h3 className="text-zinc-500 text-sm font-medium mb-2">{title}</h3>
        <p className="text-2xl font-bold mb-1">{formatGold(safeValue)}</p>
        <div className={`flex items-center text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
          <span>{formatGold(Math.abs(safeChange))}</span>
          <span className="ml-1">({formatPercent(safeChangePercent)})</span>
        </div>
      </div>
    )
  }

  // Calculate min and max values for the chart
  const { minPrice, maxPrice, avgPrice } = useMemo(() => {
    if (!filteredData.length) {
      return { minPrice: 0, maxPrice: 0, avgPrice: 0 }
    }

    const min = Math.min(...filteredData.map((item) => item.purchase_price)) * 0.98 // 2% buffer
    const max = Math.max(...filteredData.map((item) => item.purchase_price)) * 1.02 // 2% buffer
    const avg = filteredData.reduce((sum, item) => sum + item.purchase_price, 0) / filteredData.length

    return { minPrice: min, maxPrice: max, avgPrice: avg }
  }, [filteredData])

  // Get zoomed data if zoom is active
  const chartData = useMemo(() => {
    if (!zoomDomain || !filteredData.length) return displayData

    const start = zoomDomain.x[0]
    const end = zoomDomain.x[1]

    // If zoom range is small, show all data points in that range
    if (end - start < dataPointLimit) {
      return filteredData.slice(start, end + 1)
    }

    // Otherwise, optimize the zoomed data
    return optimizeDataForDisplay(filteredData.slice(start, end + 1))
  }, [zoomDomain, filteredData, displayData, dataPointLimit, optimizeDataForDisplay])

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{itemName} Statistics</h1>
            <p className="text-zinc-400">Price history and performance metrics</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
            <Button
              variant="outline"
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
              onClick={() => router.back()}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <AlertTriangle className="mr-2 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <p className="font-medium mb-1">Error loading data:</p>
                <p>{error}</p>
                <p className="mt-2 text-sm">Using fallback data for preview purposes.</p>
              </div>
            </div>
          </div>
        )}

        {showNoDataMessage && (
          <div className="bg-amber-900/20 border border-amber-800 text-amber-300 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <Info className="mr-2 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <p className="font-medium mb-1">No price data available</p>
                <p>There is no price history data available for this item.</p>
                <p className="mt-2 text-sm">Showing sample data for preview purposes.</p>
              </div>
            </div>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Current Price"
              value={stats.price}
              change={stats.per_day?.gold}
              changePercent={stats.per_day?.percent}
            />
            <StatCard
              title="Weekly Change"
              value={stats.price}
              change={stats.per_week?.gold}
              changePercent={stats.per_week?.percent}
            />
            <StatCard
              title="Monthly Change"
              value={stats.price}
              change={stats.per_month?.gold}
              changePercent={stats.per_month?.percent}
            />
            <StatCard
              title="Yearly Change"
              value={stats.price}
              change={stats.per_year?.gold}
              changePercent={stats.per_year?.percent}
            />
          </div>
        )}

        <div
          ref={chartContainerRef}
          className={`bg-zinc-900 border border-zinc-800 rounded-lg p-6 ${isFullscreen ? "fixed inset-0 z-50 overflow-auto" : ""}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold">Price History</h2>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 text-zinc-400 hover:text-zinc-100"
                onClick={() => setShowInfoDialog(true)}
              >
                <Info size={16} />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex rounded-md overflow-hidden">
                {(["1W", "1M", "3M", "6M", "1Y", "ALL"] as TimePeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
                    className={`px-3 py-1.5 text-sm font-medium ${
                      selectedPeriod === period
                        ? "bg-purple-600 text-white"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                    {chartType === "line" ? "Line Chart" : chartType === "area" ? "Area Chart" : "Candlestick"}
                    <ChevronDown size={14} className="ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                  <DropdownMenuItem
                    onClick={() => toggleChartType("line")}
                    className="text-zinc-300 hover:text-white focus:text-white"
                  >
                    Line Chart
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toggleChartType("area")}
                    className="text-zinc-300 hover:text-white focus:text-white"
                  >
                    Area Chart
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-[300px] text-zinc-500">
              <div className="flex flex-col items-center">
                <RefreshCw size={24} className="animate-spin mb-2" />
                <p>Loading chart data...</p>
              </div>
            </div>
          ) : filteredData.length > 0 ? (
            <div>
              <div className="flex justify-end mb-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  onClick={handleZoomIn}
                >
                  <ZoomIn size={16} className="mr-1" />
                  Zoom In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  onClick={handleZoomOut}
                  disabled={!zoomDomain}
                >
                  <ZoomOut size={16} className="mr-1" />
                  Zoom Out
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  onClick={resetZoom}
                  disabled={!zoomDomain}
                >
                  <RotateCcw size={16} className="mr-1" />
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  onClick={exportData}
                >
                  <Download size={16} className="mr-1" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  onClick={shareData}
                >
                  <Share2 size={16} className="mr-1" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize size={16} className="mr-1" /> : <Maximize size={16} className="mr-1" />}
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </Button>
              </div>

              <div className="relative h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "line" ? (
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      onMouseMove={handleChartMouseMove}
                      onMouseLeave={handleChartMouseLeave}
                      ref={chartRef}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis
                        dataKey="formattedDate"
                        stroke="#71717a"
                        tick={{ fill: "#a1a1aa" }}
                        tickMargin={10}
                        minTickGap={30}
                      />
                      <YAxis
                        stroke="#71717a"
                        tick={{ fill: "#a1a1aa" }}
                        tickFormatter={(value) => `${value} G`}
                        domain={[minPrice, maxPrice]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <ReferenceLine
                        y={avgPrice}
                        stroke="#8884d8"
                        strokeDasharray="3 3"
                        label={{
                          value: `Avg: ${formatGold(avgPrice)}`,
                          fill: "#8884d8",
                          position: "insideBottomRight",
                        }}
                      />
                      {stats && (
                        <ReferenceLine
                          y={stats.price}
                          stroke="#10b981"
                          strokeDasharray="3 3"
                          label={{
                            value: `Current: ${formatGold(stats.price)}`,
                            fill: "#10b981",
                            position: "insideTopRight",
                          }}
                        />
                      )}
                      <Line
                        name="Price"
                        type="monotone"
                        dataKey="purchase_price"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={chartData.length < 50 ? { r: 3, strokeWidth: 1 } : false}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        animationDuration={500}
                        isAnimationActive={!zoomDomain}
                        connectNulls={true}
                      />
                      <Brush
                        dataKey="formattedDate"
                        height={30}
                        stroke="#8884d8"
                        fill="#27272a"
                        tickFormatter={() => ""}
                      />
                    </LineChart>
                  ) : (
                    <AreaChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      onMouseMove={handleChartMouseMove}
                      onMouseLeave={handleChartMouseLeave}
                      ref={chartRef}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis
                        dataKey="formattedDate"
                        stroke="#71717a"
                        tick={{ fill: "#a1a1aa" }}
                        tickMargin={10}
                        minTickGap={30}
                      />
                      <YAxis
                        stroke="#71717a"
                        tick={{ fill: "#a1a1aa" }}
                        tickFormatter={(value) => `${value} G`}
                        domain={[minPrice, maxPrice]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <ReferenceLine
                        y={avgPrice}
                        stroke="#8884d8"
                        strokeDasharray="3 3"
                        label={{
                          value: `Avg: ${formatGold(avgPrice)}`,
                          fill: "#8884d8",
                          position: "insideBottomRight",
                        }}
                      />
                      {stats && (
                        <ReferenceLine
                          y={stats.price}
                          stroke="#10b981"
                          strokeDasharray="3 3"
                          label={{
                            value: `Current: ${formatGold(stats.price)}`,
                            fill: "#10b981",
                            position: "insideTopRight",
                          }}
                        />
                      )}
                      <Area
                        name="Price"
                        type="monotone"
                        dataKey="purchase_price"
                        stroke="#8884d8"
                        fill="url(#colorGradient)"
                        strokeWidth={2}
                        dot={chartData.length < 50 ? { r: 3, strokeWidth: 1 } : false}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        animationDuration={500}
                        isAnimationActive={!zoomDomain}
                        connectNulls={true}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <Brush
                        dataKey="formattedDate"
                        height={30}
                        stroke="#8884d8"
                        fill="#27272a"
                        tickFormatter={() => ""}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>

                {/* Long hover info overlay */}
                {longHoverInfo && longHoverInfo.data && (
                  <div
                    className="absolute bg-zinc-800/90 border border-zinc-700 p-3 rounded-md shadow-lg z-10"
                    style={{
                      left: longHoverInfo.x + 10,
                      top: longHoverInfo.y - 80,
                      maxWidth: "200px",
                    }}
                  >
                    <p className="text-zinc-300 text-sm font-medium mb-1">
                      {longHoverInfo.data.formattedDateTime || longHoverInfo.data.formattedDate}
                    </p>
                    <p className="text-zinc-100 font-bold">{formatGold(longHoverInfo.data.purchase_price)}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex items-center text-zinc-400 mb-2">
                    <Calendar size={16} className="mr-2" />
                    <span className="text-sm">Time Period</span>
                  </div>
                  <p className="text-lg font-medium">
                    {selectedPeriod === "ALL" ? "All Available Data" : selectedPeriod}
                    {zoomDomain ? " (Zoomed)" : ""}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    {filteredData.length} total points / {chartData.length} displayed
                  </p>
                </div>

                <div className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex items-center text-zinc-400 mb-2">
                    <Coins size={16} className="mr-2" />
                    <span className="text-sm">Price Range</span>
                  </div>
                  <p className="text-lg font-medium">
                    {formatGold(minPrice)} - {formatGold(maxPrice)}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">Spread: {formatGold(maxPrice - minPrice)}</p>
                </div>

                <div className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex items-center text-zinc-400 mb-2">
                    <Percent size={16} className="mr-2" />
                    <span className="text-sm">Volatility</span>
                  </div>
                  <p className="text-lg font-medium">
                    {avgPrice ? (((maxPrice - minPrice) / avgPrice) * 100).toFixed(2) : "0.00"}%
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">Avg. Price: {formatGold(avgPrice)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-[300px] text-zinc-500">
              <p className="mb-4">No price history available</p>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw size={16} className="mr-2" />
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>About Price Statistics</DialogTitle>
            <DialogDescription className="text-zinc-400">How to use the price history chart</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-zinc-200 mb-1">Time Periods</h3>
              <p className="text-zinc-400 text-sm">
                Select different time periods (1W, 1M, 3M, 6M, 1Y, ALL) to view price history over specific timeframes.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-zinc-200 mb-1">Chart Types</h3>
              <p className="text-zinc-400 text-sm">
                Switch between Line and Area charts to visualize price trends in different ways.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-zinc-200 mb-1">Zoom Controls</h3>
              <p className="text-zinc-400 text-sm">
                Use Zoom In, Zoom Out, and Reset buttons to focus on specific time periods. You can also use the brush
                control at the bottom of the chart to select a specific range.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-zinc-200 mb-1">Data Export</h3>
              <p className="text-zinc-400 text-sm">
                Export the price history data as a CSV file for further analysis in spreadsheet software.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-zinc-200 mb-1">Reference Lines</h3>
              <p className="text-zinc-400 text-sm">
                The chart displays reference lines for the average price and current price to help you compare values.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
