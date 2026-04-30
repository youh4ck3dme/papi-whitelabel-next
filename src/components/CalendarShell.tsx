import type { Appointment, Employee, Service } from "@/lib/data/types";
import { formatDate, formatTime } from "@/lib/format";

type CalendarShellProps = {
  title: string;
  mode: "admin" | "employee";
  employees: Employee[];
  services: Service[];
  appointments: Appointment[];
};

const days = [
  "2026-05-04T00:00:00.000+02:00",
  "2026-05-05T00:00:00.000+02:00",
  "2026-05-06T00:00:00.000+02:00",
  "2026-05-07T00:00:00.000+02:00",
  "2026-05-08T00:00:00.000+02:00",
  "2026-05-09T00:00:00.000+02:00",
  "2026-05-10T00:00:00.000+02:00",
];

function isSameCalendarDate(leftIso: string, rightIso: string) {
  const left = new Date(leftIso);
  const right = new Date(rightIso);
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function CalendarShell({
  title,
  mode,
  employees,
  services,
  appointments,
}: CalendarShellProps) {
  const serviceById = new Map(services.map((service) => [service.id, service]));
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));

  return (
    <section className="calendar-shell" aria-label={title}>
      <div className="calendar-toolbar">
        <div>
          <p className="eyebrow">{mode === "admin" ? "Owner/admin" : "Employee"}</p>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>{title}</h1>
        </div>
        <div className="nav" aria-label="Calendar views">
          <span className="button primary">Week</span>
          <span className="button">Day</span>
          <span className="button">Month</span>
        </div>
      </div>

      <div className="calendar-grid" role="grid">
        <div className="day-head">Time</div>
        {days.map((day) => (
          <div className="day-head" key={day}>
            {formatDate(day)}
          </div>
        ))}

        {["08:00", "09:00", "10:00", "11:00", "12:00"].map((hour) => (
          <div key={hour} style={{ display: "contents" }}>
            <div className="time-cell">
              {hour}
            </div>
            {days.map((day) => (
              <div className="day-cell" key={`${hour}-${day}`}>
                {appointments
                  .filter((appointment) => isSameCalendarDate(appointment.startAt, day))
                  .filter((appointment) => formatTime(appointment.startAt).startsWith(hour.slice(0, 2)))
                  .map((appointment) => (
                    <article className="event" key={appointment.id}>
                      <strong>{appointment.clientName}</strong>
                      <span className="muted">
                        {formatTime(appointment.startAt)}-{formatTime(appointment.endAt)}
                      </span>
                      <span>{serviceById.get(appointment.serviceId)?.name}</span>
                      {mode === "admin" ? (
                        <span className="muted">{employeeById.get(appointment.employeeId)?.name}</span>
                      ) : null}
                      <span className="status">{appointment.status}</span>
                    </article>
                  ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
