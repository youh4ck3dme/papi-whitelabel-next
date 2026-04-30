import { AppTopBar } from "@/components/AppTopBar";
import { CalendarShell } from "@/components/CalendarShell";
import { bookingRepository } from "@/lib/data/repository";

export default async function EmployeeSchedulePage() {
  const [services, employees] = await Promise.all([
    bookingRepository.listServices(),
    bookingRepository.listEmployees(),
  ]);
  const currentEmployee = employees.find((employee) => employee.role === "employee") ?? employees[0];
  const appointments = await bookingRepository.listAppointmentsForEmployee(currentEmployee.id);

  return (
    <div className="app-shell">
      <AppTopBar />
      <CalendarShell
        title={`${currentEmployee.name}'s schedule`}
        mode="employee"
        services={services}
        employees={[currentEmployee]}
        appointments={appointments}
      />
    </div>
  );
}
