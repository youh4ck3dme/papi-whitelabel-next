export type Service = {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  priceCents: number;
};

export type Employee = {
  id: string;
  name: string;
  role: "owner" | "admin" | "employee";
  email: string;
};

export type AppointmentStatus = "confirmed" | "pending" | "completed";

export type Appointment = {
  id: string;
  employeeId: string;
  serviceId: string;
  clientName: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
};

export type BookingRepository = {
  listServices(): Promise<Service[]>;
  listEmployees(): Promise<Employee[]>;
  listAppointments(): Promise<Appointment[]>;
  listAppointmentsForEmployee(employeeId: string): Promise<Appointment[]>;
};
