"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const services = [
  {
    name: "Haircut",
    price: 30,
  },
  {
    name: "Kids Haircut",
    price: 25,
  },
  {
    name: "Haircut + Beard",
    price: 40,
  },
  {
    name: "Beard Cleanup",
    price: 15,
  },
];

function getTimesForDay(dateString: string) {
  if (!dateString) return [];

  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();

  // Friday closed
  if (day === 5) return [];

  let startHour = 9;
  let endHour = 20;

  // Saturday: 9 AM - 7 PM
  if (day === 6) {
    startHour = 9;
    endHour = 19;
  }

  // Sunday: 10 AM - 6 PM
  if (day === 0) {
    startHour = 10;
    endHour = 18;
  }

  const result: string[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour;

    result.push(`${displayHour}:00 ${suffix}`);
  }

  return result;
}

function timeToMinutes(time: string) {
  const [clock, period] = time.split(" ");
  let [hour] = clock.split(":").map(Number);

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60;
}

export default function BookingPage() {
  const [service, setService] = useState<(typeof services)[number] | null>(
    null
  );

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const minDate = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const availableTimes = getTimesForDay(selectedDate);

  useEffect(() => {
    async function loadBookedTimes() {
      if (!selectedDate) {
        setBookedTimes([]);
        return;
      }

      setLoadingTimes(true);
      setSelectedTime("");
      setMessage("");

      const { data, error } = await supabase
        .from("appointments")
        .select("time")
        .eq("date", selectedDate)
        .neq("status", "cancelled");

      if (error) {
        console.error(error);
        setMessage(`Error: ${error.message}`);
        setBookedTimes([]);
      } else {
        setBookedTimes((data || []).map((item) => item.time));
      }

      setLoadingTimes(false);
    }

    loadBookedTimes();
  }, [selectedDate]);

  const isTimePassed = (time: string) => {
    if (selectedDate !== minDate) return false;

    const now = new Date();

    return timeToMinutes(time) <= now.getHours() * 60 + now.getMinutes();
  };

  const handleBooking = async () => {
    setMessage("");
    setSuccess(false);

    if (!service) {
      setMessage("Please choose a service.");
      return;
    }

    if (!selectedDate) {
      setMessage("Please choose a date.");
      return;
    }

    if (!selectedTime) {
      setMessage("Please choose a time.");
      return;
    }

    if (!name.trim() || !phone.trim()) {
      setMessage("Please enter your name and phone number.");
      return;
    }

    if (bookedTimes.includes(selectedTime)) {
      setMessage("Sorry, this time is already booked.");
      return;
    }

    if (isTimePassed(selectedTime)) {
      setMessage("This time has already passed.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("appointments").insert({
      name: name.trim(),
      phone: phone.trim(),
      date: selectedDate,
      time: selectedTime,
      service: service.name,
      price: service.price,
      status: "confirmed",
    });

    if (error) {
      console.error(error);
      setMessage(`Error: ${error.message}`);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setMessage("");

    setBookedTimes((current) => [...current, selectedTime]);
  };

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white md:px-12">
      <div className="mx-auto max-w-3xl">

        {/* Top navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <a
            href="/"
            className="text-sm text-zinc-500 transition hover:text-white"
          >
            ← Back to website
          </a>

          <a
            href="/booking/manage"
            className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-semibold transition hover:border-white hover:bg-zinc-900"
          >
            Manage Booking
          </a>
        </div>

        {/* Header */}
        <div className="mt-12">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
            Book appointment
          </p>

          <h1 className="mt-3 text-5xl font-bold tracking-tight md:text-6xl">
            Choose your service.
          </h1>

          <p className="mt-4 text-zinc-400">
            Pick a service, choose a date and select an available time.
          </p>
        </div>

        {/* Services */}
        {!success && (
          <section className="mt-12">
            <p className="mb-4 text-sm text-zinc-400">
              1. Select service
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((item) => {
                const selected = service?.name === item.name;

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setService(item);
                      setMessage("");
                    }}
                    className={
                      selected
                        ? "rounded-2xl border border-white bg-white p-5 text-left text-black"
                        : "rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-left transition hover:border-zinc-500"
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">
                        {item.name}
                      </span>

                      <span className="font-bold">
                        ${item.price}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Date */}
        {!success && service && (
          <section className="mt-10">
            <p className="mb-4 text-sm text-zinc-400">
              2. Select date
            </p>

            <input
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setSelectedTime("");
                setMessage("");
              }}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-white outline-none focus:border-white"
            />

            {selectedDate &&
              new Date(`${selectedDate}T12:00:00`).getDay() === 5 && (
                <p className="mt-3 text-sm text-red-400">
                  Friday is closed.
                </p>
              )}
          </section>
        )}

        {/* Times */}
        {!success && service && selectedDate && (
          <section className="mt-10">
            <p className="mb-4 text-sm text-zinc-400">
              3. Select time
            </p>

            {loadingTimes ? (
              <p className="text-zinc-500">
                Checking availability...
              </p>
            ) : availableTimes.length === 0 ? (
              <p className="text-zinc-500">
                No appointments are available on this day.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {availableTimes.map((time) => {
                  const booked = bookedTimes.includes(time);
                  const passed = isTimePassed(time);

                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={booked || passed}
                      onClick={() => {
                        setSelectedTime(time);
                        setMessage("");
                      }}
                      className={
                        booked || passed
                          ? "cursor-not-allowed rounded-xl border border-zinc-900 bg-zinc-950 px-4 py-4 text-zinc-700"
                          : selectedTime === time
                          ? "rounded-xl border border-white bg-white px-4 py-4 text-black"
                          : "rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4 transition hover:border-zinc-500"
                      }
                    >
                      {booked ? "Booked" : passed ? "Passed" : time}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Customer */}
        {!success && service && selectedDate && selectedTime && (
          <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-500">
              4. Your information
            </p>

            <div className="mt-5 space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-4 text-white outline-none placeholder:text-zinc-600 focus:border-white"
              />

              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-4 text-white outline-none placeholder:text-zinc-600 focus:border-white"
              />
            </div>

            {/* Summary */}
            <div className="mt-6 rounded-xl border border-zinc-800 p-5">
              <p className="text-sm text-zinc-500">
                Appointment summary
              </p>

              <div className="mt-3 space-y-1">
                <p className="font-semibold">
                  {service.name} — ${service.price}
                </p>

                <p className="text-zinc-400">
                  {selectedDate}
                </p>

                <p className="text-zinc-400">
                  {selectedTime}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBooking}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-white py-4 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? "Booking..." : "Confirm Appointment"}
            </button>

            {message && (
              <p className="mt-4 text-center text-sm text-red-400">
                {message}
              </p>
            )}
          </section>
        )}

        {/* Success */}
        {success && (
          <section className="mt-12 rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center md:p-12">
            <div className="text-5xl">✓</div>

            <p className="mt-6 text-sm uppercase tracking-[0.3em] text-zinc-500">
              Booking confirmed
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              See you soon!
            </h2>

            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-zinc-800 p-6 text-left">
              <p className="font-semibold">
                {service?.name} — ${service?.price}
              </p>

              <p className="mt-2 text-zinc-400">
                {selectedDate}
              </p>

              <p className="text-zinc-400">
                {selectedTime}
              </p>

              <p className="mt-4 text-sm text-zinc-500">
                3810A Nostrand Avenue
                <br />
                Brooklyn, NY
              </p>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="/"
                className="rounded-full bg-white px-6 py-3 font-semibold text-black"
              >
                Back to website
              </a>

              <a
                href="/booking/manage"
                className="rounded-full border border-zinc-700 px-6 py-3 font-semibold transition hover:bg-zinc-800"
              >
                Manage Booking
              </a>

              <a
                href="tel:+19295859392"
                className="rounded-full border border-zinc-700 px-6 py-3 font-semibold transition hover:bg-zinc-800"
              >
                Call Me
              </a>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}