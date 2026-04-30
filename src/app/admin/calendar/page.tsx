import { AppTopBar } from "@/components/AppTopBar";
import { CalendarShell } from "@/components/CalendarShell";
import { bookingRepository } from "@/lib/data/repository";

export default async function AdminCalendarPage() {
  const [services, employees, appointments] = await Promise.all([
    bookingRepository.listServices(),
    bookingRepository.listEmployees(),
    bookingRepository.listAppointments(),
  ]);

  return (
    <div className="app-shell">
      <AppTopBar />
      <CalendarShell
        title="Admin calendar"
        mode="admin"
        services={services}
        employees={employees}
        appointments={appointments}
      />
    </div>
  );
}
