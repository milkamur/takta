const bookingButton = document.getElementById("bookingButton");
const bookingMessage = document.getElementById("bookingMessage");

bookingButton.addEventListener("click", async () => {
  bookingMessage.textContent = "";

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (!session?.user) {
    window.location.href = "account.html?mode=register&redirect=booking.html";
    return;
  }

  bookingButton.disabled = true;
  bookingButton.querySelector("span").textContent = "БРОНИРУЕМ...";

  const { data, error } = await supabaseClient
    .from("bookings")
    .insert({
      user_id: session.user.id,
      game_date: "2026-09-12",
      game_time: "19:00:00",
      game_title: "JAX — ЗАКРЫТАЯ ИГРА",
      status: "pending"
    })
    .select()
    .single();

  if (error) {
    console.error(error);

    bookingMessage.textContent =
      "Не удалось создать бронь. Попробуйте ещё раз.";

    bookingButton.disabled = false;
    bookingButton.querySelector("span").textContent = "ЗАБРОНИРОВАТЬ";
    return;
  }

  bookingMessage.textContent =
    "БРОНЬ СОЗДАНА ✓";

  bookingButton.querySelector("span").textContent = "ЗАБРОНИРОВАНО";
});