/**
 * Formula PM 2.0 Milestone Calendar Component
 * V3 Phase 1 Implementation
 * 
 * Calendar view for milestone tracking using react-day-picker
 */

'use client'

import { useState, useMemo } from 'react'
import { format, isSameDay, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isPast } from 'date-fns'
import { Milestone, MilestoneCalendarEvent } from '@/types/milestones'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Target,
  CheckCircle,
  PlayCircle,
  Circle,
  AlertTriangle,
  XCircle,
  Clock,
  Plus
} from 'lucide-react'

interface MilestoneCalendarProps {
  milestones: Milestone[]
  onDateSelect?: (date: Date) => void
  onMilestoneSelect?: (milestone: Milestone) => void
  onCreateMilestone?: (date: Date) => void
  selectedDate?: Date
  className?: string
  showLegend?: boolean
  viewMode?: 'month' | 'week'
}

export const MilestoneCalendar: React.FC<MilestoneCalendarProps> = ({
  milestones,
  onDateSelect,
  onMilestoneSelect,
  onCreateMilestone,
  selectedDate = new Date(),
  className,
  showLegend = true,
  viewMode = 'month'
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)

  // Convert milestones to calendar events
  const calendarEvents = useMemo((): MilestoneCalendarEvent[] => {
    return milestones
      .filter(milestone => milestone.target_date)
      .map(milestone => ({
        id: milestone.id,
        title: milestone.name,
        date: new Date(milestone.target_date),
        status: milestone.status,
        milestone
      }))
  }, [milestones])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, MilestoneCalendarEvent[]>()
    
    calendarEvents.forEach(event => {
      const dateKey = format(event.date, 'yyyy-MM-dd')
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(event)
    })
    
    return grouped
  }, [calendarEvents])

  // Get milestones for selected date
  const milestonesForDate = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    return eventsByDate.get(dateKey) || []
  }, [selectedDate, eventsByDate])

  // Calendar month statistics
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    
    const monthEvents = calendarEvents.filter(event => 
      event.date >= monthStart && event.date <= monthEnd
    )
    
    const completed = monthEvents.filter(e => e.status === 'completed').length
    const overdue = monthEvents.filter(e => e.status === 'overdue' || (isPast(e.date) && e.status !== 'completed')).length
    const upcoming = monthEvents.filter(e => e.status === 'upcoming').length
    const inProgress = monthEvents.filter(e => e.status === 'in_progress').length
    
    return { total: monthEvents.length, completed, overdue, upcoming, inProgress }
  }, [currentDate, calendarEvents])

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-blue-500'
      case 'overdue':
        return 'bg-red-500'
      case 'cancelled':
        return 'bg-gray-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'in_progress':
        return <PlayCircle className="h-3 w-3 text-blue-600" />
      case 'overdue':
        return <AlertTriangle className="h-3 w-3 text-red-600" />
      case 'cancelled':
        return <XCircle className="h-3 w-3 text-gray-600" />
      default:
        return <Circle className="h-3 w-3 text-gray-400" />
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    setCurrentDate(date)
    if (onDateSelect) {
      onDateSelect(date)
    }
  }

  const handleMilestoneClick = (milestone: Milestone) => {
    setSelectedMilestone(milestone)
    if (onMilestoneSelect) {
      onMilestoneSelect(milestone)
    }
  }

  const handleCreateMilestone = (date: Date) => {
    if (onCreateMilestone) {
      onCreateMilestone(date)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Milestone Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{monthStats.total} this month</Badge>
          {monthStats.overdue > 0 && (
            <Badge variant="destructive">{monthStats.overdue} overdue</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{format(currentDate, 'MMMM yyyy')}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={currentDate}
                onMonthChange={setCurrentDate}
                className="w-full"
                modifiers={{
                  hasMilestones: (date) => {
                    const dateKey = format(date, 'yyyy-MM-dd')
                    return eventsByDate.has(dateKey)
                  }
                }}
                modifiersClassNames={{
                  hasMilestones: 'bg-blue-50 border-blue-200'
                }}
              />
              
              {/* Simple milestone list for current month */}
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">This Month's Milestones</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {Array.from(eventsByDate.entries())
                    .filter(([dateKey]) => isSameMonth(new Date(dateKey), currentDate))
                    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                    .map(([dateKey, events]) => (
                      <div key={dateKey} className="text-sm">
                        <div className="font-medium text-muted-foreground">
                          {format(new Date(dateKey), 'MMM d')}
                        </div>
                        {events.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center gap-2 ml-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-2"
                            onClick={() => handleMilestoneClick(event.milestone)}
                          >
                            {getStatusIcon(event.status)}
                            <span className="text-sm truncate">{event.title}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Legend */}
          {showLegend && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Upcoming</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Overdue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                  <span className="text-sm">Cancelled</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Month Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">This Month</CardTitle>
              <CardDescription>
                {format(currentDate, 'MMMM yyyy')} overview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total</span>
                <Badge variant="outline">{monthStats.total}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed</span>
                <Badge variant="secondary">{monthStats.completed}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">In Progress</span>
                <Badge variant="secondary">{monthStats.inProgress}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Upcoming</span>
                <Badge variant="secondary">{monthStats.upcoming}</Badge>
              </div>
              {monthStats.overdue > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overdue</span>
                  <Badge variant="destructive">{monthStats.overdue}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Date Milestones */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {format(selectedDate, 'MMM d, yyyy')}
                </CardTitle>
                <CardDescription>
                  {milestonesForDate.length === 0 
                    ? 'No milestones on this date'
                    : `${milestonesForDate.length} milestone${milestonesForDate.length === 1 ? '' : 's'}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {milestonesForDate.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleMilestoneClick(event.milestone)}
                  >
                    {getStatusIcon(event.status)}
                    <span className="text-sm font-medium truncate">{event.title}</span>
                  </div>
                ))}
                
                {milestonesForDate.length === 0 && onCreateMilestone && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateMilestone(selectedDate)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}