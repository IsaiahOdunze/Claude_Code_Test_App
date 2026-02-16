import { useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAssignments } from '../../hooks/useAssignments';
import type { Assignment } from '../../hooks/useAssignments';
import ChoreDetailModal from './ChoreDetailModal';

export default function CalendarView() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const { data: assignments = [] } = useAssignments(
    dateRange?.start ?? null,
    dateRange?.end ?? null
  );

  const events = assignments.map((a) => ({
    id: a.id,
    title: `${a.chore.title} - ${a.user.name}`,
    date: a.assignedDate.split('T')[0],
    className: a.completion ? 'completed' : '',
    extendedProps: { assignment: a },
  }));

  const handleDatesSet = useCallback((arg: { start: Date; end: Date }) => {
    setDateRange({ start: arg.start, end: arg.end });
  }, []);

  const handleEventClick = useCallback((info: any) => {
    const assignment = info.event.extendedProps.assignment as Assignment;
    setSelectedAssignment(assignment);
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Calendar</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek',
          }}
          events={events}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          height="auto"
          dayMaxEvents={3}
          eventDisplay="block"
        />
      </div>

      {selectedAssignment && (
        <ChoreDetailModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}
    </div>
  );
}
