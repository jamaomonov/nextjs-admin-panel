"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FormField {
  name: string
  label: string
  type: "text" | "color" | "select"
  required?: boolean
  options?: { id: number; name: string }[]
  defaultValue?: string | number
}

interface GenericFormProps {
  endpoint: string
  entityName: string
  initialData?: Record<string, any>
  fields: FormField[]
  onSuccess: () => void
  onCancel: () => void
}

export default function GenericForm({
  endpoint,
  entityName,
  initialData,
  fields,
  onSuccess,
  onCancel,
}: GenericFormProps) {
  const isEditing = !!initialData?.id

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const data: Record<string, any> = {}

    fields.forEach((field) => {
      if (initialData && initialData[field.name] !== undefined) {
        data[field.name] = initialData[field.name]
      } else if (field.defaultValue !== undefined) {
        data[field.name] = field.defaultValue
      } else if (field.type === "select") {
        data[field.name] = "" // Empty string for "Not selected"
      } else {
        data[field.name] = ""
      }
    })

    return data
  })

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user makes changes
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Process form data to ensure correct types
      const processedData = { ...formData }

      // Convert select fields to numbers if they have values
      fields.forEach((field) => {
        if (field.type === "select" && processedData[field.name]) {
          processedData[field.name] = Number(processedData[field.name])
        }
      })

      const url = isEditing ? `${endpoint}/${initialData.id}` : endpoint
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(processedData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 400 || response.status === 422) {
          // Handle Bad Request or Unprocessable Entity with details
          const errorMessage = responseData.error || responseData.message || responseData.detail || "Неверные данные"
          let errorDetails = ""

          if (responseData.details) {
            errorDetails =
              typeof responseData.details === "object"
                ? JSON.stringify(responseData.details, null, 2)
                : responseData.details
          }

          throw new Error(`${errorMessage}${errorDetails ? `\n${errorDetails}` : ""}`)
        }
        throw new Error(responseData.error || "Произошла ошибка при сохранении")
      }

      toast({
        title: "Успешно",
        description: isEditing ? `${entityName} обновлен` : `${entityName} создан`,
      })

      onSuccess()
    } catch (error) {
      console.error(`Error saving ${entityName}:`, error)
      setError(error instanceof Error ? error.message : "Произошла ошибка при сохранении")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
        </Alert>
      )}

      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>

          {field.type === "text" && (
            <Input
              id={field.name}
              value={formData[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="bg-zinc-800 border-zinc-700"
              required={field.required}
            />
          )}

          {field.type === "color" && (
            <div className="flex gap-2">
              <Input
                id={field.name}
                type="color"
                value={formData[field.name] || "#000000"}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-16 p-1 h-10 bg-zinc-800 border-zinc-700"
                required={field.required}
              />
              <Input
                value={formData[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="flex-1 font-mono bg-zinc-800 border-zinc-700"
                placeholder="#000000"
              />
            </div>
          )}

          {field.type === "select" && field.options && (
            <Select
              value={String(formData[field.name] || "")}
              onValueChange={(value) => handleChange(field.name, value ? Number(value) : "")}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder={`Не выбрано`} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {field.options.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
        >
          Отмена
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-zinc-700 hover:bg-zinc-600">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  )
}
