export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="text-xl font-bold tracking-widest">
          BOHDAN<span className="text-zinc-500">BARBER</span>
        </div>

        <a
          href="/booking"
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Book Now
        </a>
      </nav>

      {/* Hero */}
      <section className="flex min-h-[80vh] items-center px-6 py-20 md:px-12">
        <div className="max-w-5xl">
          <p className="mb-5 text-sm uppercase tracking-[0.35em] text-zinc-500">
            Brooklyn • New York
          </p>

          <h1 className="text-6xl font-bold leading-[0.95] tracking-tight md:text-8xl">
            YOUR HAIR.
            <br />
            YOUR STYLE.
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-8 text-zinc-400">
            Clean cuts, sharp fades and attention to every detail.
            Book your next appointment and leave looking your best.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/booking"
              className="rounded-full bg-white px-7 py-4 font-semibold text-black transition hover:bg-zinc-200"
            >
              Book Appointment
            </a>

            <a
              href="#services"
              className="rounded-full border border-zinc-700 px-7 py-4 font-semibold transition hover:bg-zinc-900"
            >
              View Services
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section
        id="services"
        className="border-t border-zinc-900 px-6 py-24 md:px-12"
      >
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-zinc-500">
          Services
        </p>

        <h2 className="mb-12 text-4xl font-bold md:text-6xl">
          What I do.
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Service name="Haircut" price="$30" />
          <Service name="Kids Haircut" price="$25" />
          <Service name="Haircut + Beard" price="$40" />
          <Service name="Beard Cleanup" price="$15" />
        </div>
      </section>

      {/* About */}
      <section className="border-t border-zinc-900 px-6 py-24 md:px-12">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-zinc-500">
              About me
            </p>

            <h2 className="text-4xl font-bold md:text-6xl">
              More than
              <br />
              just a haircut.
            </h2>
          </div>

          <p className="max-w-xl self-end text-lg leading-8 text-zinc-400">
            I&apos;m focused on improving every day, learning modern
            techniques and giving every client a clean, personalized look.
          </p>
        </div>
      </section>

      {/* Location / Contact */}
      <section className="border-t border-zinc-900 px-6 py-24 md:px-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-zinc-500">
              Location
            </p>

            <h2 className="text-4xl font-bold">
              Come get your cut.
            </h2>

            <p className="mt-6 text-lg text-zinc-400">
              3810A Nostrand Avenue
              <br />
              Brooklyn, NY
            </p>

            <a
              href="https://www.google.com/maps/search/?api=1&query=3810A+Nostrand+Avenue+Brooklyn+NY"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full border border-zinc-700 px-6 py-3 font-semibold transition hover:bg-zinc-900"
            >
              Get Directions
            </a>
          </div>

          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-zinc-500">
              Contact
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="tel:+19295859392"
                className="rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200"
              >
                Call Me
              </a>

              <a
                href="sms:+19295859392"
                className="rounded-full border border-zinc-700 px-6 py-3 font-semibold transition hover:bg-zinc-900"
              >
                Text Me
              </a>

              <a
                href="https://www.instagram.com/mmmeisssa.barber/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-zinc-700 px-6 py-3 font-semibold transition hover:bg-zinc-900"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Booking */}
      <section className="border-t border-zinc-900 px-6 py-24 md:px-12">
        <div className="rounded-3xl bg-zinc-900 p-8 md:p-16">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-zinc-500">
            Appointments
          </p>

          <h2 className="text-4xl font-bold md:text-6xl">
            Ready for a fresh cut?
          </h2>

          <p className="mt-6 max-w-xl text-zinc-400">
            Choose your service, pick a time and book your appointment
            online.
          </p>

          <a
            href="/booking"
            className="mt-8 inline-block rounded-full bg-white px-7 py-4 font-semibold text-black transition hover:bg-zinc-200"
          >
            Book Your Appointment
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-8 text-sm text-zinc-600 md:px-12">
        © 2026 Bohdan Barber. All rights reserved.
      </footer>
    </main>
  );
}

function Service({
  name,
  price,
}: {
  name: string;
  price: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 p-7 transition hover:border-zinc-600">
      <h3 className="text-2xl font-semibold">{name}</h3>

      <div className="mt-10">
        <span className="text-3xl font-bold">{price}</span>
      </div>
    </div>
  );
}