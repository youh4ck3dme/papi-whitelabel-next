import type { Appointment, Employee, Service } from "./types";

export const services: Service[] = [
  {
    id: "cut-men",
    name: "Pánsky strih",
    category: "Strih",
    durationMinutes: 40,
    priceCents: 2500,
  },
  {
    id: "cut-women",
    name: "Dámsky strih",
    category: "Strih",
    durationMinutes: 60,
    priceCents: 3900,
  },
  {
    id: "color",
    name: "Farbenie",
    category: "Farba",
    durationMinutes: 120,
    priceCents: 7900,
  },
  {
    id: "styling",
    name: "Styling",
    category: "Finish",
    durationMinutes: 45,
    priceCents: 2900,
  },
];

export const employees: Employee[] = [
  { id: "eva", name: "Eva", role: "owner", email: "owner@example.com" },
  { id: "mato", name: "Mato", role: "employee", email: "mato@example.com" },
  { id: "miska", name: "Miska", role: "employee", email: "miska@example.com" },
];

export const appointments: Appointment[] = [
  {
    id: "apt-1001",
    employeeId: "eva",
    serviceId: "cut-women",
    clientName: "Jana Novakova",
    startAt: "2026-05-04T08:00:00.000+02:00",
    endAt: "2026-05-04T09:00:00.000+02:00",
    status: "confirmed",
  },
  {
    id: "apt-1002",
    employeeId: "mato",
    serviceId: "cut-men",
    clientName: "Peter H.",
    startAt: "2026-05-04T09:20:00.000+02:00",
    endAt: "2026-05-04T10:00:00.000+02:00",
    status: "pending",
  },
  {
    id: "apt-1003",
    employeeId: "miska",
    serviceId: "color",
    clientName: "Lucia K.",
    startAt: "2026-05-05T11:00:00.000+02:00",
    endAt: "2026-05-05T13:00:00.000+02:00",
    status: "confirmed",
  },
];
