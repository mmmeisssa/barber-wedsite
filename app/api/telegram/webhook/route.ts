import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number;
    };
    text?: string;
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: {
      chat?: {
        id?: number;
      };
    };
  };
};

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

async function telegram(
  method: string,
  body: Record<string, unknown>
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    console.error("Telegram API error:", result);
    throw new Error("Telegram API request failed");
  }

  return result;
}

function formatAppointment(appointment: Appointment) {
  const status =
    appointment.status === "confirmed"
      ? "🟢 Confirmed"
      : appointment.status === "cancelled"
        ? "🔴 Cancelled"
        : `🟡 ${appointment.status}`;

  return [
    `👤 ${appointment.name}`,
    `📞 ${appointment.phone}`,
    `✂️ ${appointment.service || "Appointment"}`,
    `💰 $${appointment.price ?? 0}`,
    `📅 ${appointment.date}`,
    `⏰ ${appointment.time}`,
    status,
  ].join("\n");
}

async function getAppointments(
  startDate?: string,
  endDate?: string
) {
  let query = supabase
    .from("appointments")
    .select(
      "id, name, phone, date, time, service, price, status"
    )
    .neq("status", "cancelled")
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (startDate) {
    query = query.gte("date", startDate);
  }

  if (endDate) {
    query = query.lte("date", endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message);
  }

  return (data || []) as Appointment[];
}

function getDateString(offset: number) {
  const date = new Date();

  date.setDate(date.getDate() + offset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function showMenu(chatId: number) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text: "💈 Barber Admin Panel\n\nChoose an option:",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📅 Today",
            callback_data: "today",
          },
          {
            text: "📆 Tomorrow",
            callback_data: "tomorrow",
          },
        ],
        [
          {
            text: "📋 All Upcoming",
            callback_data: "all",
          },
        ],
        [
          {
            text: "📊 Statistics",
            callback_data: "stats",
          },
        ],
      ],
    },
  });
}

async function showAppointments(
  chatId: number,
  appointments: Appointment[],
  title: string
) {
  if (appointments.length === 0) {
    await telegram("sendMessage", {
      chat_id: chatId,
      text: `${title}\n\n✅ No appointments found.`,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⬅️ Menu",
              callback_data: "menu",
            },
          ],
        ],
      },
    });

    return;
  }

  await telegram("sendMessage", {
    chat_id: chatId,
    text: `${title}\n\n📋 ${appointments.length} appointment${
      appointments.length === 1 ? "" : "s"
    }:`,
  });

  for (const appointment of appointments) {
    await telegram("sendMessage", {
      chat_id: chatId,
      text: formatAppointment(appointment),
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "❌ Cancel",
              callback_data: `cancel:${appointment.id}`,
            },
          ],
        ],
      },
    });
  }

  await telegram("sendMessage", {
    chat_id: chatId,
    text: "What would you like to do?",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🔄 Refresh",
            callback_data: "menu",
          },
        ],
      ],
    },
  });
}

async function showStatistics(chatId: number) {
  const today = getDateString(0);

  const { data, error } = await supabase
    .from("appointments")
    .select("id, date, price, status")
    .neq("status", "cancelled");

  if (error) {
    console.error("Statistics error:", error);

    await telegram("sendMessage", {
      chat_id: chatId,
      text: "❌ Failed to load statistics.",
    });

    return;
  }

  const appointments = data || [];

  const todayAppointments = appointments.filter(
    (appointment) => appointment.date === today
  );

  const totalRevenue = appointments.reduce(
    (sum, appointment) =>
      sum + Number(appointment.price || 0),
    0
  );

  const todayRevenue = todayAppointments.reduce(
    (sum, appointment) =>
      sum + Number(appointment.price || 0),
    0
  );

  await telegram("sendMessage", {
    chat_id: chatId,
    text:
      `📊 Barber Statistics\n\n` +
      `📅 Today: ${todayAppointments.length} appointments\n` +
      `💰 Today revenue: $${todayRevenue.toFixed(2)}\n\n` +
      `📋 Upcoming/active appointments: ${appointments.length}\n` +
      `💵 Total booked revenue: $${totalRevenue.toFixed(2)}`,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "⬅️ Menu",
            callback_data: "menu",
          },
        ],
      ],
    },
  });
}

export async function POST(request: Request) {
  try {
    const update =
      (await request.json()) as TelegramUpdate;

    const chatId =
      update.message?.chat?.id ??
      update.callback_query?.message?.chat?.id;

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    // Only allow your Telegram account.
    if (String(chatId) !== String(ADMIN_CHAT_ID)) {
      console.warn(
        `Unauthorized Telegram chat: ${chatId}`
      );

      return NextResponse.json({ ok: true });
    }

    // Handle buttons.
    if (update.callback_query) {
      const callback = update.callback_query;
      const data = callback.data || "";

      await telegram("answerCallbackQuery", {
        callback_query_id: callback.id,
      });

      if (data === "menu") {
        await showMenu(chatId);

        return NextResponse.json({ ok: true });
      }

      if (data === "today") {
        const today = getDateString(0);

        const appointments = await getAppointments(
          today,
          today
        );

        await showAppointments(
          chatId,
          appointments,
          `📅 Today — ${today}`
        );

        return NextResponse.json({ ok: true });
      }

      if (data === "tomorrow") {
        const tomorrow = getDateString(1);

        const appointments = await getAppointments(
          tomorrow,
          tomorrow
        );

        await showAppointments(
          chatId,
          appointments,
          `📆 Tomorrow — ${tomorrow}`
        );

        return NextResponse.json({ ok: true });
      }

      if (data === "all") {
        const today = getDateString(0);

        const appointments =
          await getAppointments(today);

        await showAppointments(
          chatId,
          appointments,
          "📋 All Upcoming Appointments"
        );

        return NextResponse.json({ ok: true });
      }

      if (data === "stats") {
        await showStatistics(chatId);

        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("cancel:")) {
        const appointmentId =
          data.replace("cancel:", "");

        const { data: appointment, error } =
          await supabase
            .from("appointments")
            .select(
              "id, name, phone, date, time, service, price, status"
            )
            .eq("id", appointmentId)
            .single();

        if (error || !appointment) {
          await telegram("sendMessage", {
            chat_id: chatId,
            text: "❌ Appointment not found.",
          });

          return NextResponse.json({ ok: true });
        }

        if (appointment.status === "cancelled") {
          await telegram("sendMessage", {
            chat_id: chatId,
            text:
              "⚠️ This appointment is already cancelled.",
          });

          return NextResponse.json({ ok: true });
        }

        const { error: updateError } =
          await supabase
            .from("appointments")
            .update({
              status: "cancelled",
            })
            .eq("id", appointmentId);

        if (updateError) {
          console.error(updateError);

          await telegram("sendMessage", {
            chat_id: chatId,
            text:
              "❌ Failed to cancel appointment.",
          });

          return NextResponse.json({ ok: true });
        }

        await telegram("sendMessage", {
          chat_id: chatId,
          text:
            `✅ Appointment cancelled.\n\n` +
            formatAppointment(appointment),
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "⬅️ Menu",
                  callback_data: "menu",
                },
              ],
            ],
          },
        });

        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    // Handle /start and /menu.
    const text = update.message?.text || "";

    if (
      text === "/start" ||
      text === "/menu"
    ) {
      await showMenu(chatId);

      return NextResponse.json({ ok: true });
    }

    await showMenu(chatId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "Telegram webhook error:",
      error
    );

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}