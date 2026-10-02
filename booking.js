const bookingButton = document.getElementById("bookingButton");
const bookingMessage = document.getElementById("bookingMessage");

// =========================
// НАСТРОЙКИ ИГРЫ
// =========================

const GAME_DATE = "2026-09-26";
const GAME_TIME = "20:00:00";
const GAME_TITLE = "JAX — ЗАКРЫТАЯ ИГРА";
const GAME_PRICE = "5000.00";

// PayKeeper
const PAYKEEPER_URL =
  "https://club241640526-vk.server.paykeeper.ru/create/";


// =========================
// СОЗДАНИЕ НОМЕРА ЗАКАЗА
// =========================

function createOrderNumber() {
  return (
    "JAX-" +
    crypto.randomUUID().split("-")[0].toUpperCase()
  );
}


// =========================
// ПОЛУЧАЕМ ПРОФИЛЬ
// =========================

async function getProfile(userId) {

  const {
    data: profile,
    error
  } = await supabaseClient
    .from("profiles")
    .select(
      "name, telegram_username, telegram_id, phone, email"
    )
    .eq("user_id", userId)
    .maybeSingle();


  if (error) {
    console.error(
      "Ошибка получения профиля:",
      error
    );

    return null;
  }

  console.log(
    "Профиль пользователя:",
    profile
  );

  return profile;
}


// =========================
// ПЕРЕХОД В PAYKEEPER
// =========================

function goToPayKeeper(
  orderNumber,
  user,
  profile
) {

  const form =
    document.createElement("form");

  form.method = "POST";
  form.action = PAYKEEPER_URL;


  // =========================
  // ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
  // =========================

  const clientName =
    profile?.name ||
    profile?.telegram_username ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "Клиент JAX";

  const clientEmail =
    profile?.email ||
    user.email ||
    "";

  const clientPhone =
    profile?.phone ||
    user.phone ||
    "";


  // =========================
  // ДАННЫЕ PAYKEEPER
  // =========================

  const fields = {

    // Сумма
    sum: GAME_PRICE,

    // Номер заказа JAX
    orderid: orderNumber,

    // Имя клиента
    clientid: clientName,

    // Услуга
    service_name:
      "Бронирование игры JAX",

    // Email
    client_email:
      clientEmail,

    // Телефон
    client_phone:
      clientPhone
  };


  console.log(
    "Отправляем в PayKeeper:",
    fields
  );


  // Создаём скрытые поля формы
  Object.entries(fields).forEach(
    ([name, value]) => {

      const input =
        document.createElement("input");

      input.type = "hidden";
      input.name = name;
      input.value = value ?? "";

      form.appendChild(input);
    }
  );


  document.body.appendChild(form);

  // Отправляем в PayKeeper
  form.submit();
}


// =========================
// ВОЗВРАЩАЕМ КНОПКУ
// =========================

function resetBookingButton() {

  bookingButton.disabled = false;

  bookingButton
    .querySelector("span")
    .textContent =
      "ЗАБРОНИРОВАТЬ";
}


// =========================
// БРОНИРОВАНИЕ
// =========================

bookingButton.addEventListener(
  "click",
  async () => {

    bookingMessage.textContent = "";


    // =========================
    // ПРОВЕРЯЕМ АВТОРИЗАЦИЮ
    // =========================

    const {
      data: { session },
      error: sessionError
    } =
      await supabaseClient.auth.getSession();


    if (sessionError) {

      console.error(
        "Ошибка получения сессии:",
        sessionError
      );

      bookingMessage.textContent =
        "Не удалось проверить аккаунт.";

      return;
    }


    if (!session?.user) {

      window.location.href =
        "account.html?mode=register&redirect=booking.html";

      return;
    }


    const user = session.user;


    bookingButton.disabled = true;

    bookingButton
      .querySelector("span")
      .textContent =
        "ПРОВЕРЯЕМ ДАННЫЕ...";


    // =========================
    // ПОЛУЧАЕМ PROFILE
    // =========================

    const profile =
      await getProfile(user.id);


    if (!profile) {

      bookingMessage.textContent =
        "Не удалось получить данные профиля.";

      resetBookingButton();

      return;
    }


    // =========================
    // ПРОВЕРЯЕМ БРОНЬ
    // =========================

    bookingButton
      .querySelector("span")
      .textContent =
        "ПРОВЕРЯЕМ БРОНЬ...";


    const {
      data: existingBooking,
      error: checkError
    } =
      await supabaseClient
        .from("bookings")
        .select("*")
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "game_date",
          GAME_DATE
        )
        .eq(
          "game_time",
          GAME_TIME
        )
        .eq(
          "status",
          "pending"
        )
        .order(
          "created_at",
          { ascending: false }
        )
        .limit(1)
        .maybeSingle();


    if (checkError) {

      console.error(
        "Ошибка проверки брони:",
        checkError
      );

      bookingMessage.textContent =
        "Не удалось проверить бронь. Попробуйте ещё раз.";

      resetBookingButton();

      return;
    }


    // =========================
    // БРОНЬ УЖЕ СУЩЕСТВУЕТ
    // =========================

    if (existingBooking) {

      let orderNumber =
        existingBooking.order_number;


      // Если номера заказа нет
      if (!orderNumber) {

        orderNumber =
          createOrderNumber();


        const {
          error: updateError
        } =
          await supabaseClient
            .from("bookings")
            .update({
              order_number:
                orderNumber
            })
            .eq(
              "id",
              existingBooking.id
            );


        if (updateError) {

          console.error(
            "Ошибка создания номера заказа:",
            updateError
          );

          bookingMessage.textContent =
            "Не удалось подготовить оплату.";

          resetBookingButton();

          return;
        }
      }


      bookingMessage.textContent =
        "ПЕРЕХОДИМ К ОПЛАТЕ...";

      bookingButton
        .querySelector("span")
        .textContent =
          "ПЕРЕХОД К ОПЛАТЕ...";


      goToPayKeeper(
        orderNumber,
        user,
        profile
      );

      return;
    }


    // =========================
    // СОЗДАЁМ НОВУЮ БРОНЬ
    // =========================

    bookingButton
      .querySelector("span")
      .textContent =
        "БРОНИРУЕМ...";


    const orderNumber =
      createOrderNumber();


    const {
      data: newBooking,
      error: insertError
    } =
      await supabaseClient
        .from("bookings")
        .insert({

          user_id:
            user.id,

          game_date:
            GAME_DATE,

          game_time:
            GAME_TIME,

          game_title:
            GAME_TITLE,

          status:
            "pending",

          order_number:
            orderNumber
        })
        .select()
        .single();


    if (insertError) {

      console.error(
        "Ошибка создания брони:",
        insertError
      );

      bookingMessage.textContent =
        "Не удалось создать бронь. Попробуйте ещё раз.";

      resetBookingButton();

      return;
    }


    console.log(
      "Бронь создана:",
      newBooking
    );


    // =========================
    // ПЕРЕХОД В PAYKEEPER
    // =========================

    bookingMessage.textContent =
      "БРОНЬ СОЗДАНА. ПЕРЕХОДИМ К ОПЛАТЕ...";

    bookingButton
      .querySelector("span")
      .textContent =
        "ПЕРЕХОД К ОПЛАТЕ...";


    goToPayKeeper(
      orderNumber,
      user,
      profile
    );
  }
);