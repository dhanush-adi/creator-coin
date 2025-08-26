"use client"

import { useState } from "react"
import { Button, Input, Card } from "@/components/ui-kit"
import { useToast } from "@/hooks/use-toast"

const TIMES = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"]

export default function BookingForm({
  creatorName = "Creator",
}: {
  creatorName?: string
}) {
  const [date, setDate] = useState<string>("")
  const [time, setTime] = useState<string>("")
  const { toast } = useToast()

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <label className="text-sm font-medium">{"Choose a date"}</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">{"Available time slots"}</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {TIMES.map((t) => (
            <Card
              key={t}
              className={`cursor-pointer p-2 text-center rounded-lg border ${
                t === time ? "border-foreground bg-muted" : "hover:bg-muted/60"
              }`}
              onClick={() => setTime(t)}
            >
              <span className="text-sm font-medium">{t}</span>
            </Card>
          ))}
        </div>
      </div>
      <Button
        className="rounded-xl"
        onClick={() => {
          if (!date || !time) {
            toast({ title: "Missing details", description: "Select a date and time." })
            return
          }
          toast({
            title: "Booking requested",
            description: `${creatorName} session on ${date} at ${time}. (Mock)`,
          })
        }}
      >
        {"Confirm Booking"}
      </Button>
    </div>
  )
}
