import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        { error: "Telegram environment variables are missing." },
        { status: 500 }
      );
    }

    const message = `
🔔 New Barber Appointment

👤 Name: ${body.name}
📞 Phone: ${body.phone}
✂️ Service: ${body.service}
💰 Price: $${body.price}
📅 Date: ${body.date}
⏰ Time: ${body.time}
    `.trim();

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Telegram error:", result);

      return NextResponse.json(
        { error: "Failed to send Telegram message." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}