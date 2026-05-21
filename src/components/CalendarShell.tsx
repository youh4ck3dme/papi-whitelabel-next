"use client";

import { useMemo, useState } from "react";
import type { Appointment, AppointmentStatus, Employee, Service } from "@/lib/data/types";
import { formatDate, formatTime } from "@/lib/format";

type CalendarShellProps = {
  title: string;
  mode: "admin" | "employee";
  employees: Employee[];
  services: Service[];
  appointments: Appointment[];
};

type CalendarView = "day" | "week";

type SlotSelection = {
  dayIso: string;
  hour: number;
};

const SLOT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - day);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoWithHour(dayIso: string, hour: number) {
  const day = new Date(dayIso);
  day.setHours(hour, 0, 0, 0);
  return day.toISOString();
}

function addMinutes(iso: string, minutes: number) {
  const value = new Date(iso);
  value.setMinutes(value.getMinutes() + minutes);
  return value.toISOString();
}

function overlaps(leftStart: string, leftEnd: string, rightStart: string, rightEnd: string) {
  const ls = new Date(leftStart).getTime();
  const le = new Date(leftEnd).getTime();
  const rs = new Date(rightStart).getTime();
  const re = new Date(rightEnd).getTime();
  return ls < re && rs < le;
}

function isSameCalendarDate(leftIso: string, rightIso: string) {
  const left = new Date(leftIso);
  const right = new Date(rightIso);
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function nextStatus(status: AppointmentStatus): AppointmentStatus {
  if (status === "pending") return "confirmed";
  if (status === "confirmed") return "completed";
  return "pending";
}

export function CalendarShell({
  title,
  mode,
  employees,
  services,
  appointments,
}: CalendarShellProps) {
  const [view, setView] = useState<CalendarView>("week");
  const [currentDay, setCurrentDay] = useState(() => {
    if (appointments.length > 0) return new Date(appointments[0].startAt);
    return new Date();
  });
  const [items, setItems] = useState<Appointment[]>(appointments);
  const [activeSlot, setActiveSlot] = useState<SlotSelection | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [draftClientName, setDraftClientName] = useState("New Client");
  const [draftServiceId, setDraftServiceId] = useState(services[0]?.id ?? "");
  const [draftEmployeeId, setDraftEmployeeId] = useState(employees[0]?.id ?? "");
  const [inlineError, setInlineError] = useState<string | null>(null);

  const serviceById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services]
  );
  const employeeById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  );

  const days = useMemo(() => {
    const anchor = startOfWeek(currentDay);
    if (view === "day") {
      const day = new Date(currentDay);
      day.setHours(0, 0, 0, 0);
      return [day.toISOString()];
    }
    return Array.from({ length: 7 }, (_, index) => addDays(anchor, index).toISOString());
  }, [currentDay, view]);

  function moveWindow(direction: -1 | 1) {
    const next = new Date(currentDay);
    next.setDate(currentDay.getDate() + direction * (view === "week" ? 7 : 1));
    setCurrentDay(next);
    setActiveSlot(null);
    setInlineError(null);
  }

  function createAppointment(slot: SlotSelection) {
    const service = serviceById.get(draftServiceId);
    if (!service) {
      setInlineError("Vyber službu.");
      return;
    }

    const requestedEmployeeId = mode === "employee" ? employees[0]?.id : draftEmployeeId;
    if (!requestedEmployeeId && employees.length === 0) {
      setInlineError("Vyber zamestnanca.");
      return;
    }

    const startAt = toIsoWithHour(slot.dayIso, slot.hour);
    const endAt = addMinutes(startAt, service.durationMinutes);

    const candidateEmployeeIds =
      mode === "employee"
        ? [employees[0]?.id].filter((value): value is string => Boolean(value))
        : [
            ...(requestedEmployeeId ? [requestedEmployeeId] : []),
            ...employees
              .map((employee) => employee.id)
              .filter((employeeId) => employeeId !== requestedEmployeeId),
          ];

    const employeeId = candidateEmployeeIds.find((candidate) => {
      const hasConflict = items.some(
        (item) =>
          item.employeeId === candidate && overlaps(item.startAt, item.endAt, startAt, endAt)
      );
      return !hasConflict;
    });

    if (!employeeId) {
      setInlineError("Tento slot je už obsadený pre všetkých dostupných zamestnancov.");
      return;
    }

    if (mode === "admin" && employeeId !== draftEmployeeId) {
      setDraftEmployeeId(employeeId);
    }

    const clientName = draftClientName.trim();
    if (!clientName) {
      setInlineError("Zadaj meno klienta.");
      return;
    }

    const appointment: Appointment = {
      id: `tmp-${Date.now()}`,
      employeeId,
      serviceId: service.id,
      clientName,
      startAt,
      endAt,
      status: "pending",
    };

    setItems((prev) => [...prev, appointment]);
    setActiveSlot(null);
    setInlineError(null);
    setActiveEventId(appointment.id);
  }

  function updateStatus(appointmentId: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === appointmentId ? { ...item, status: nextStatus(item.status) } : item
      )
    );
  }

  function removeAppointment(appointmentId: string) {
    setItems((prev) => prev.filter((item) => item.id !== appointmentId));
    if (activeEventId === appointmentId) setActiveEventId(null);
  }

  return (
    <section className="calendar-shell" aria-label={title}>
      <div className="calendar-toolbar">
        <div>
          <p className="eyebrow">{mode === "admin" ? "Owner/admin" : "Employee"}</p>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>{title}</h1>
          <p className="muted">Klikni na voľný slot a vytvor booking.</p>
        </div>

        <div className="nav" aria-label="Calendar controls">
          <button className="button" onClick={() => moveWindow(-1)} type="button">
            ←
          </button>
          <button
            className={`button ${view === "day" ? "primary" : ""}`}
            onClick={() => setView("day")}
            type="button"
          >
            Day
          </button>
          <button
            className={`button ${view === "week" ? "primary" : ""}`}
            onClick={() => setView("week")}
            type="button"
          >
            Week
          </button>
          <button className="button" onClick={() => moveWindow(1)} type="button">
            →
          </button>
        </div>
      </div>

      <div className="calendar-grid" role="grid">
        <div className="day-head">Time</div>
        {days.map((day) => (
          <div className="day-head" key={day}>
            {formatDate(day)}
          </div>
        ))}

        {SLOT_HOURS.map((hour) => (
          <div key={hour} style={{ display: "contents" }}>
            <div className="time-cell">{String(hour).padStart(2, "0")}:00</div>
            {days.map((day) => {
              const slotKey = `${hour}-${day}`;
              const inSlot = items
                .filter((appointment) => isSameCalendarDate(appointment.startAt, day))
                .filter((appointment) => new Date(appointment.startAt).getHours() === hour);
              const slotActive = activeSlot?.dayIso === day && activeSlot?.hour === hour;

              return (
                <div
                  className={`day-cell ${slotActive ? "day-cell-active" : ""}`}
                  key={slotKey}
                  onClick={() => {
                    setActiveSlot({ dayIso: day, hour });
                    setInlineError(null);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveSlot({ dayIso: day, hour });
                      setInlineError(null);
                    }
                  }}
                >
                  <button
                    className="cell-add-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveSlot({ dayIso: day, hour });
                      setInlineError(null);
                    }}
                    type="button"
                  >
                    + Add
                  </button>

                  {inSlot.map((appointment) => (
                    <article
                      className={`event ${activeEventId === appointment.id ? "event-active" : ""}`}
                      key={appointment.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveEventId(appointment.id);
                      }}
                    >
                      <strong>{appointment.clientName}</strong>
                      <span className="muted">
                        {formatTime(appointment.startAt)}-{formatTime(appointment.endAt)}
                      </span>
                      <span>{serviceById.get(appointment.serviceId)?.name}</span>
                      {mode === "admin" ? (
                        <span className="muted">{employeeById.get(appointment.employeeId)?.name}</span>
                      ) : null}
                      <span className="status">{appointment.status}</span>

                      {activeEventId === appointment.id ? (
                        <div className="event-actions">
                          <button
                            className="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              updateStatus(appointment.id);
                            }}
                            type="button"
                          >
                            Status →
                          </button>
                          <button
                            className="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeAppointment(appointment.id);
                            }}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </article>
                  ))}

                  {slotActive ? (
                    <div className="slot-editor" onClick={(event) => event.stopPropagation()}>
                      <input
                        onChange={(event) => setDraftClientName(event.target.value)}
                        placeholder="Meno klienta"
                        value={draftClientName}
                      />
                      <select
                        onChange={(event) => setDraftServiceId(event.target.value)}
                        value={draftServiceId}
                      >
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} ({service.durationMinutes} min)
                          </option>
                        ))}
                      </select>
                      {mode === "admin" ? (
                        <select
                          onChange={(event) => setDraftEmployeeId(event.target.value)}
                          value={draftEmployeeId}
                        >
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name}
                            </option>
                          ))}
                        </select>
                      ) : null}

                      {inlineError ? <p className="inline-error">{inlineError}</p> : null}

                      <div className="slot-actions">
                        <button
                          className="button primary"
                          onClick={() => createAppointment({ dayIso: day, hour })}
                          type="button"
                        >
                          Create
                        </button>
                        <button
                          className="button"
                          onClick={() => {
                            setActiveSlot(null);
                            setInlineError(null);
                          }}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
