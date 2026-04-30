import { appointments, employees, services } from "./mock-data";
import type { BookingRepository } from "./types";

export const mockBookingRepository: BookingRepository = {
  async listServices() {
    return services;
  },
  async listEmployees() {
    return employees;
  },
  async listAppointments() {
    return appointments;
  },
  async listAppointmentsForEmployee(employeeId) {
    return appointments.filter((appointment) => appointment.employeeId === employeeId);
  },
};
