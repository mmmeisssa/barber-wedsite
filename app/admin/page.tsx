"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Appointment = {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  status: string | null;
  created_at?: string;
  service?: string | null;
  price?: number | null;
};

const services: Record<string, number> = {
  Haircut: 30,
  "Kids Haircut": 25,
  "Haircut + Beard": 40,
  "Beard Cleanup": 15,
};

function getTimesForDay(dateString: string) {
  if (!dateString) return [];

  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();

  // Friday closed
  if (day === 5) return [];

  let startHour = 9;
  let endHour = 20;

  // Saturday
  if (day === 6) {
    startHour = 9;
    endHour = 19;
  }

  // Sunday
  if (day === 0) {
    startHour = 10;
    endHour = 18;
  }

  const times: string[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour;

    times.push(`${displayHour}:00 ${suffix}`);
  }

  return times;
}

export default function AdminPage() {
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [error, setError] = useState("");

  const loadAppointments = async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/admin/login");
      return;
    }

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      console.error(error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setAppointments((data || []) as Appointment[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesSearch =
        !query ||
        appointment.name.toLowerCase().includes(query) ||
        appointment.phone.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (appointment.status || "confirmed") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  const updateAppointment = async (
    id: string,
    changes: Partial<Appointment>
  ) => {
    setSavingId(id);
    setError("");

    const { data, error } = await supabase
      .from("appointments")
      .update(changes)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(error);
      setError(error.message);
      setSavingId(null);
      return;
    }

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id
          ? { ...appointment, ...data }
          : appointment
      )
    );

    setSavingId(null);
  };

  const deleteAppointment = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this appointment?"
    );

    if (!confirmed) return;

    setSavingId(id);
    setError("");

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setError(error.message);
      setSavingId(null);
      return;
    }

    setAppointments((current) =>
      current.filter((appointment) => appointment.id !== id)
    );

    setSavingId(null);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const getPrice = (appointment: Appointment) => {
    if (appointment.price) {
      return appointment.price;
    }

    if (appointment.service && services[appointment.service]) {
      return services[appointment.service];
    }

    return null;
  };

  return (
    <main className="min-h-screen bg-black px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="flex flex-col gap-5 border-b border-zinc-900 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <a
              href="/"
              className="text-sm text-zinc-500 transition hover:text-white"
            >
              ← Website
            </a>

            <p className="mt-8 text-sm uppercase tracking-[0.3em] text-zinc-500">
              Admin
            </p>

            <h1 className="mt-2 text-4xl font-bold md:text-5xl">
              Appointments
            </h1>

            <p className="mt-3 text-zinc-500">
              Manage your bookings.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadAppointments}
              className="rounded-full border border-zinc-800 px-5 py-2.5 text-sm font-semibold transition hover:border-zinc-500"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-400 transition hover:border-red-900 hover:text-red-400"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Controls */}
        <section className="mt-8 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            placeholder="Search name or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-white"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none"
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Stats */}
        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat
            label="All"
            value={appointments.length}
          />

          <Stat
            label="Confirmed"
            value={
              appointments.filter(
                (item) => (item.status || "confirmed") === "confirmed"
              ).length
            }
          />

          <Stat
            label="Completed"
            value={
              appointments.filter(
                (item) => item.status === "completed"
              ).length
            }
          />
        </section>

        {/* Appointments */}
        <section className="mt-8">
          {loading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">
              Loading appointments...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-lg font-semibold">
                No appointments found.
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Try changing your search or filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => {
                const status = appointment.status || "confirmed";
                const times = getTimesForDay(appointment.date);
                const price = getPrice(appointment);

                return (
                  <article
                    key={appointment.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 md:p-6"
                  >
                    <div className="flex flex-col gap-6">

                      {/* Top */}
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-bold">
                              {appointment.name}
                            </h2>

                            <StatusBadge status={status} />
                          </div>

                          <a
                            href={`tel:${appointment.phone.replace(
                              /[^0-9+]/g,
                              ""
                            )}`}
                            className="mt-2 inline-block text-zinc-400 transition hover:text-white"
                          >
                            {appointment.phone}
                          </a>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-2xl font-bold">
                            {price ? `$${price}` : "—"}
                          </p>

                          <p className="text-sm text-zinc-500">
                            {appointment.service || "Service not saved"}
                          </p>
                        </div>
                      </div>

                      {/* Date / Time */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                            Date
                          </span>

                          <input
                            type="date"
                            value={appointment.date}
                            onChange={(event) =>
                              updateAppointment(appointment.id, {
                                date: event.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none focus:border-white"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                            Time
                          </span>

                          <select
                            value={appointment.time}
                            onChange={(event) =>
                              updateAppointment(appointment.id, {
                                time: event.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none focus:border-white"
                          >
                            {!times.includes(appointment.time) && (
                              <option value={appointment.time}>
                                {appointment.time}
                              </option>
                            )}

                            {times.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-5">

                        <button
                          type="button"
                          disabled={savingId === appointment.id}
                          onClick={() =>
                            updateAppointment(appointment.id, {
                              status: "completed",
                            })
                          }
                          className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold transition hover:border-white disabled:opacity-50"
                        >
                          ✓ Completed
                        </button>

                        <button
                          type="button"
                          disabled={savingId === appointment.id}
                          onClick={() =>
                            updateAppointment(appointment.id, {
                              status: "cancelled",
                            })
                          }
                          className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-400 transition hover:border-red-700 hover:text-red-400 disabled:opacity-50"
                        >
                          × Cancel
                        </button>

                        <button
                          type="button"
                          disabled={savingId === appointment.id}
                          onClick={() =>
                            updateAppointment(appointment.id, {
                              status: "confirmed",
                            })
                          }
                          className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-400 transition hover:border-white hover:text-white disabled:opacity-50"
                        >
                          ↻ Confirm
                        </button>

                        <button
                          type="button"
                          disabled={savingId === appointment.id}
                          onClick={() =>
                            deleteAppointment(appointment.id)
                          }
                          className="rounded-full border border-red-950 px-4 py-2 text-sm font-semibold text-red-500 transition hover:border-red-700 hover:bg-red-950/30 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>

                      {savingId === appointment.id && (
                        <p className="text-xs text-zinc-600">
                          Saving...
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === "completed") {
    return (
      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
        Completed
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="rounded-full border border-red-900 px-3 py-1 text-xs font-semibold text-red-400">
        Cancelled
      </span>
    );
  }

  return (
    <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300">
      Confirmed
    </span>
  );
}