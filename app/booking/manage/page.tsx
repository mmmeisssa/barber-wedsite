"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Appointment = {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  service: string | null;
  price: number | null;
  status: string;
};

function getAppointmentDate(date: string, time: string) {
  const [clock, period] = time.split(" ");
  let [hour, minute] = clock.split(":").map(Number);

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return new Date(
    `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0"
    )}:00`
  );
}

function canCancel(date: string, time: string) {
  const appointmentDate = getAppointmentDate(date, time);
  const now = new Date();

  return appointmentDate.getTime() - now.getTime() >= 30 * 60 * 1000;
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function cleanPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export default function ManageBookingPage() {
  const [phone, setPhone] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState("");

  const findAppointments = async () => {
    setMessage("");
    setSearched(false);
    setAppointments([]);

    const searchPhone = cleanPhone(phone);

    if (!searchPhone) {
      setMessage("Please enter your phone number.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("appointments")
      .select(
        "id, name, phone, date, time, service, price, status"
      )
      .neq("status", "cancelled")
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      console.error(error);
      setMessage(`Error: ${error.message}`);
      setLoading(false);
      return;
    }

    const matchingAppointments = (data || []).filter(
      (appointment) =>
        cleanPhone(appointment.phone) === searchPhone
    );

    const now = new Date();

    const futureAppointments = matchingAppointments.filter(
      (appointment) => {
        const appointmentDate = getAppointmentDate(
          appointment.date,
          appointment.time
        );

        return appointmentDate > now;
      }
    );

    setAppointments(futureAppointments);
    setSearched(true);
    setLoading(false);
  };

  const cancelAppointment = async (
    appointment: Appointment
  ) => {
    setMessage("");

    if (!canCancel(appointment.date, appointment.time)) {
      setMessage(
        "This appointment can no longer be cancelled. Cancellations must be made at least 30 minutes before the appointment."
      );
      return;
    }

    const confirmed = window.confirm(
      `Cancel your ${
        appointment.service || "appointment"
      } on ${formatDate(appointment.date)} at ${
        appointment.time
      }?`
    );

    if (!confirmed) return;

    setCancellingId(appointment.id);

    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
      })
      .eq("id", appointment.id);

    if (error) {
      console.error(error);
      setMessage(`Error: ${error.message}`);
      setCancellingId(null);
      return;
    }

    setAppointments((current) =>
      current.filter((item) => item.id !== appointment.id)
    );

    setCancellingId(null);
    setMessage("Your appointment has been cancelled.");
  };

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white md:px-12">
      <div className="mx-auto max-w-3xl">
        <a
          href="/booking"
          className="text-sm text-zinc-500 transition hover:text-white"
        >
          ← Back to booking
        </a>

        <div className="mt-12">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
            Manage booking
          </p>

          <h1 className="mt-3 text-5xl font-bold tracking-tight md:text-6xl">
            Your appointments.
          </h1>

          <p className="mt-4 max-w-xl text-zinc-400">
            Enter the phone number you used when booking to
            view or cancel your appointment.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:p-8">
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">
              Phone number
            </span>

            <input
              type="tel"
              placeholder="(929) 585-9392"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  findAppointments();
                }
              }}
              className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-4 text-white outline-none placeholder:text-zinc-600 focus:border-white"
            />
          </label>

          <button
            type="button"
            onClick={findAppointments}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-white py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading
              ? "Searching..."
              : "Find My Appointment"}
          </button>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-300">
            {message}
          </div>
        )}

        {searched &&
          appointments.length === 0 &&
          !message && (
            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-lg font-semibold">
                No upcoming appointments found.
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Check that you entered the same phone number
                used for your booking.
              </p>
            </div>
          )}

        {appointments.length > 0 && (
          <div className="mt-8 space-y-4">
            {appointments.map((appointment) => {
              const allowed = canCancel(
                appointment.date,
                appointment.time
              );

              return (
                <div
                  key={appointment.id}
                  className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:p-8"
                >
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                        Confirmed
                      </p>

                      <h2 className="mt-2 text-2xl font-bold">
                        {appointment.service ||
                          "Appointment"}
                      </h2>

                      <p className="mt-2 text-zinc-400">
                        {formatDate(appointment.date)}
                      </p>

                      <p className="text-zinc-400">
                        {appointment.time}
                      </p>

                      {appointment.price !== null && (
                        <p className="mt-4 text-lg font-semibold">
                          ${appointment.price}
                        </p>
                      )}
                    </div>

                    <div className="sm:text-right">
                      {allowed ? (
                        <>
                          <p className="mb-3 text-xs text-zinc-500">
                            Free cancellation until 30 minutes
                            before appointment
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              cancelAppointment(appointment)
                            }
                            disabled={
                              cancellingId ===
                              appointment.id
                            }
                            className="rounded-full border border-red-900 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-950 disabled:opacity-50"
                          >
                            {cancellingId ===
                            appointment.id
                              ? "Cancelling..."
                              : "Cancel Appointment"}
                          </button>
                        </>
                      ) : (
                        <div className="rounded-xl border border-zinc-800 px-4 py-3 text-sm text-zinc-500">
                          Cancellation unavailable
                          <br />
                          Less than 30 minutes remaining
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <a
            href="/booking"
            className="text-sm text-zinc-500 transition hover:text-white"
          >
            Need a new appointment? Book here →
          </a>
        </div>
      </div>
    </main>
  );
}