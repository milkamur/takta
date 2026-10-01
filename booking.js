const bookingButton = document.getElementById("bookingButton");
const bookingMessage = document.getElementById("bookingMessage");

// =========================
// НАСТРОЙКИ ИГРЫ
// =========================

const GAME_DATE = "2026-09-26";
const GAME_TIME = "20:00:00";
const GAME_TITLE = "JAX — ЗАКРЫТАЯ ИГРА";

// Платёжная ссылка PayKeeper
const PAYMENT_URL =
  "https://lnk.paykeeper.ru/KXpnUmdU";


// =========================
// БРОНИРОВАНИЕ
// =========================

bookingButton.addEventListener("click", async () => {
  bookingMessage.textContent = "";

  // Проверяем авторизацию
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (!session?.user) {
    window.location.href =
      "account.html?mode=register&redirect=booking.html";
    return;
  }

  bookingButton.disabled = true;

  bookingButton.querySelector("span").textContent =
    "ПРОВЕРЯЕМ БРОНЬ...";


  // =========================
  // ПРОВЕРЯЕМ СУЩЕСТВУЮЩУЮ БРОНЬ
  // =========================

  const { data: existingBooking, error: checkError } =
    await supabaseClient
      .from("bookings")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("game_date", GAME_DATE)
      .eq("game_time", GAME_TIME)
      .eq("status", "pending")
      .maybeSingle();


  if (checkError) {
    console.error("Ошибка проверки брони:", checkError);

    bookingMessage.textContent =
      "Не удалось проверить бронь. Попробуйте ещё раз.";

    bookingButton.disabled = false;

    bookingButton.querySelector("span").textContent =
      "ЗАБРОНИРОВАТЬ";

    return;
  }


  // =========================
  // БРОНЬ УЖЕ ЕСТЬ
  // =========================

  if (existingBooking) {
    bookingMessage.textContent =
      "БРОНЬ УЖЕ СОЗДАНА. ПЕРЕХОДИМ К ОПЛАТЕ...";

    bookingButton.querySelector("span").textContent =
      "ПЕРЕХОД К ОПЛАТЕ...";

    window.location.href = PAYMENT_URL;

    return;
  }


  // =========================
  // СОЗДАЁМ НОВУЮ БРОНЬ
  // =========================

  bookingButton.querySelector("span").textContent =
    "БРОНИРУЕМ...";

  const { data: newBooking, error: insertError } =
    await supabaseClient
      .from("bookings")
      .insert({
        user_id: session.user.id,
        game_date: GAME_DATE,
        game_time: GAME_TIME,
        game_title: GAME_TITLE,
        status: "pending"
      })
      .select()
      .single();


  if (insertError) {
    console.error("Ошибка создания брони:", insertError);

    bookingMessage.textContent =
      "Не удалось создать бронь. Попробуйте ещё раз.";

    bookingButton.disabled = false;

    bookingButton.querySelector("span").textContent =
      "ЗАБРОНИРОВАТЬ";

    return;
  }


  // =========================
  // ПЕРЕХОД К ОПЛАТЕ
  // =========================

  bookingMessage.textContent =
    "БРОНЬ СОЗДАНА. ПЕРЕХОДИМ К ОПЛАТЕ...";

  bookingButton.querySelector("span").textContent =
    "ПЕРЕХОД К ОПЛАТЕ...";

  window.location.href = PAYMENT_URL;
});