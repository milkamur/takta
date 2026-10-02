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
// ПЕРЕХОД В PAYKEEPER
// =========================

function goToPayKeeper(orderNumber, user) {

  const form = document.createElement("form");

  form.method = "POST";
  form.action = PAYKEEPER_URL;

  // Данные, которые отправляем PayKeeper
  const fields = {
    sum: GAME_PRICE,

    // ВАЖНО:
    // именно этот номер PayKeeper потом
    // вернёт нашему webhook
    orderid: orderNumber,

    service_name: "Бронирование игры JAX",

    // ID пользователя Supabase
    clientid: user.id,

    // E-mail пользователя, если есть
    client_email: user.email || ""
  };


  Object.entries(fields).forEach(
    ([name, value]) => {

      const input =
        document.createElement("input");

      input.type = "hidden";
      input.name = name;
      input.value = value;

      form.appendChild(input);
    }
  );


  document.body.appendChild(form);

  // Отправляем POST в PayKeeper
  form.submit();
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
      data: { session }
    } =
      await supabaseClient.auth.getSession();


    if (!session?.user) {

      window.location.href =
        "account.html?mode=register&redirect=booking.html";

      return;
    }


    bookingButton.disabled = true;

    bookingButton
      .querySelector("span")
      .textContent =
        "ПРОВЕРЯЕМ БРОНЬ...";


    // =========================
    // ИЩЕМ СУЩЕСТВУЮЩУЮ БРОНЬ
    // =========================

    const {
      data: existingBooking,
      error: checkError
    } =
      await supabaseClient
        .from("bookings")
        .select("*")
        .eq(
          "user_id",
          session.user.id
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

      bookingButton.disabled = false;

      bookingButton
        .querySelector("span")
        .textContent =
          "ЗАБРОНИРОВАТЬ";

      return;
    }


    // =========================
    // БРОНЬ УЖЕ СУЩЕСТВУЕТ
    // =========================

    if (existingBooking) {

      let orderNumber =
        existingBooking.order_number;


      // Если почему-то номер отсутствует
      if (!orderNumber) {

        orderNumber =
          createOrderNumber();


        const { error: updateError } =
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

          bookingButton.disabled =
            false;

          bookingButton
            .querySelector("span")
            .textContent =
              "ЗАБРОНИРОВАТЬ";

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
        session.user
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
            session.user.id,

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

      bookingButton.disabled =
        false;

      bookingButton
        .querySelector("span")
        .textContent =
          "ЗАБРОНИРОВАТЬ";

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
      session.user
    );
  }
);