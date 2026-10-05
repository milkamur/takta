const bookingButton = document.getElementById("bookingButton");
const bookingMessage = document.getElementById("bookingMessage");

// =========================
// НАСТРОЙКИ ИГРЫ
// =========================

let GAME_ID = null;
let GAME_DATE = null;
let GAME_TIME = null;
let GAME_TITLE = null;
let GAME_PRICE = null;


// =========================
// ПОЛУЧАЕМ АКТИВНУЮ ИГРУ
// =========================

async function loadActiveGame() {

  const {
    data: game,
    error
  } = await supabaseClient
    .from("games")
    .select(
      "id, title, game_date, game_time, end_time, format, location, location_details, price"
    )
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();


  if (error) {
    console.error(
      "Ошибка получения активной игры:",
      error
    );

    return false;
  }


  if (!game) {
    console.error(
      "Активная игра не найдена"
    );

    return false;
  }


  GAME_ID = game.id;
  GAME_DATE = game.game_date;
  GAME_TIME = game.game_time;
  GAME_TITLE = game.title;
  GAME_PRICE = Number(game.price).toFixed(2);

  // =========================
// ПОКАЗЫВАЕМ ДАННЫЕ ИГРЫ
// =========================

const endTimeElement =
document.getElementById("gameEndTime");

const formatElement =
document.getElementById("gameFormat");

const locationElement =
document.getElementById("gameLocation");

const locationDetailsElement =
document.getElementById("gameLocationDetails");

const priceElement =
document.getElementById("gamePrice");


if (endTimeElement) {
endTimeElement.textContent =
  game.end_time
    ? game.end_time.slice(0, 5)
    : "—";
}

if (formatElement) {
formatElement.textContent =
  game.format || "—";
}

if (locationElement) {
locationElement.textContent =
  game.location || "—";
}

if (locationDetailsElement) {
locationDetailsElement.textContent =
  game.location_details || "";
}

if (priceElement) {
priceElement.textContent =
  game.price
    ? `${Number(game.price).toLocaleString("ru-RU")} ₽`
    : "—";
}

  // =========================
// ПОКАЗЫВАЕМ ИГРУ НА СТРАНИЦЕ
// =========================

const dateElement =
document.getElementById("gameDate");

const timeElement =
document.getElementById("gameTime");

if (dateElement) {
const [year, month, day] =
  GAME_DATE.split("-");

const months = [
  "ЯНВАРЯ",
  "ФЕВРАЛЯ",
  "МАРТА",
  "АПРЕЛЯ",
  "МАЯ",
  "ИЮНЯ",
  "ИЮЛЯ",
  "АВГУСТА",
  "СЕНТЯБРЯ",
  "ОКТЯБРЯ",
  "НОЯБРЯ",
  "ДЕКАБРЯ"
];

dateElement.textContent =
  `${Number(day)} ${months[Number(month) - 1]}`;
}

if (timeElement) {
timeElement.textContent =
  GAME_TIME.slice(0, 5);
}

  console.log(
    "Активная игра:",
    game
  );

  return true;
}

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
// ОТКРЫВАЕМ ФОРМУ БРОНИРОВАНИЯ
// =========================

if (bookingButton) {

  bookingButton.addEventListener("click", () => {

    console.log("КНОПКА ЗАБРОНИРОВАТЬ НАЖАТА");

    const bookingForm =
      document.getElementById("bookingForm");

    const bookingPayText =
      document.getElementById("bookingPayText");

    if (!bookingForm) {
      console.error("НЕ НАЙДЕН #bookingForm");
      return;
    }

    if (bookingPayText && GAME_PRICE) {
      bookingPayText.textContent =
        `ОПЛАТИТЬ ${Number(GAME_PRICE).toLocaleString("ru-RU")} ₽`;
    }

    bookingForm.hidden = false;
    bookingButton.hidden = true;

    bookingForm.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  });

}

// =========================
// ЗАГРУЖАЕМ ИГРУ ПРИ ОТКРЫТИИ СТРАНИЦЫ
// =========================

loadActiveGame();

// =========================
// ФОРМАТ ТЕЛЕФОНА РФ
// =========================

const guestPhoneInput =
  document.getElementById("guestPhone");

if (guestPhoneInput) {

  // Если поле пустое — сразу ставим +7
  if (!guestPhoneInput.value.trim()) {
    guestPhoneInput.value = "+7 ";
  }

  guestPhoneInput.addEventListener(
    "input",
    () => {

      let digits =
        guestPhoneInput.value.replace(/\D/g, "");

      // Убираем код страны
      if (digits.startsWith("7")) {
        digits = digits.slice(1);
      }

      // Максимум 10 цифр после +7
      digits = digits.slice(0, 10);

      let formatted = "+7";

      if (digits.length > 0) {
        formatted +=
          " (" + digits.slice(0, 3);
      }

      if (digits.length >= 3) {
        formatted +=
          ") " + digits.slice(3, 6);
      }

      if (digits.length >= 6) {
        formatted +=
          "-" + digits.slice(6, 8);
      }

      if (digits.length >= 8) {
        formatted +=
          "-" + digits.slice(8, 10);
      }

      guestPhoneInput.value =
        formatted;
    }
  );

  guestPhoneInput.addEventListener(
    "focus",
    () => {
      if (!guestPhoneInput.value.trim()) {
        guestPhoneInput.value = "+7 ";
      }
    }
  );

  guestPhoneInput.addEventListener(
    "blur",
    () => {

      const digits =
        guestPhoneInput.value.replace(/\D/g, "");

      if (digits.length <= 1) {
        guestPhoneInput.value = "+7 ";
      }
    }
  );
}

// =========================
// ОПЛАТА БРОНИ
// =========================

const bookingPayButton =
  document.getElementById("bookingPayButton");

if (bookingPayButton) {

  bookingPayButton.addEventListener(
    "click",
    async () => {

      bookingMessage.textContent = "";

      const guestName =
        document
          .getElementById("guestName")
          .value
          .trim();

      const guestPhone =
        document
          .getElementById("guestPhone")
          .value
          .trim();

      const guestEmail =
        document
          .getElementById("guestEmail")
          .value
          .trim();


      // =========================
      // // =========================
// ПРОВЕРКА ФОРМЫ
// =========================

// Имя:
// только русские буквы, пробел и дефис
const nameRegex =
/^[А-ЯЁа-яё]+(?:[ -][А-ЯЁа-яё]+)*$/;

if (!guestName) {
bookingMessage.textContent =
  "УКАЖИТЕ ИМЯ";
return;
}

if (!nameRegex.test(guestName)) {
bookingMessage.textContent =
  "ИМЯ ДОЛЖНО БЫТЬ НА РУССКОМ";
return;
}


// Телефон:
// убираем пробелы, скобки и дефисы
const phoneDigits =
guestPhone.replace(/\D/g, "");

// Принимаем:
// 89505373217
// +79505373217
const phoneIsValid =
/^7\d{10}$/.test(phoneDigits) ||
/^8\d{10}$/.test(phoneDigits);

if (!guestPhone) {
bookingMessage.textContent =
  "УКАЖИТЕ НОМЕР ТЕЛЕФОНА";
return;
}

if (!phoneIsValid) {
bookingMessage.textContent =
  "УКАЖИТЕ КОРРЕКТНЫЙ НОМЕР ТЕЛЕФОНА РФ";
return;
}


// Email
const emailRegex =
/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

if (!guestEmail) {
bookingMessage.textContent =
  "УКАЖИТЕ ПОЧТУ";
return;
}

if (!emailRegex.test(guestEmail)) {
bookingMessage.textContent =
  "УКАЖИТЕ КОРРЕКТНУЮ ПОЧТУ";
return;
}


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
          "НЕ УДАЛОСЬ ПРОВЕРИТЬ АККАУНТ";

        return;
      }


      if (!session?.user) {

        window.location.href =
          "account.html?mode=register&redirect=booking.html";

        return;
      }


      const user = session.user;


      // =========================
      // ПРОВЕРЯЕМ ИГРУ
      // =========================

      if (!GAME_ID) {

        const gameLoaded =
          await loadActiveGame();

        if (!gameLoaded || !GAME_ID) {

          bookingMessage.textContent =
            "ИГРА НЕ НАЙДЕНА";

          return;
        }
      }


      bookingPayButton.disabled = true;

      const bookingPayText =
        document.getElementById("bookingPayText");

      if (bookingPayText) {
        bookingPayText.textContent =
          "СОЗДАЁМ БРОНЬ...";
      }


      // =========================
      // НОМЕР ЗАКАЗА
      // =========================

      const orderNumber =
        createOrderNumber();


      // =========================
      // СОЗДАЁМ БРОНЬ
      // =========================

      const { error: insertError } =
      await supabaseClient
        .from("bookings")
        .insert({
    
          user_id: user.id,
    
          game_id: GAME_ID,
    
          game_date: GAME_DATE,
    
          game_time: GAME_TIME,
    
          game_title: GAME_TITLE,
    
          guest_name: guestName,
    
          guest_phone: guestPhone,
    
          guest_email: guestEmail,
    
          price: Number(GAME_PRICE),
    
          status: "pending",
    
          order_number: orderNumber
    
        });

      if (insertError) {

        console.error(
          "Ошибка создания брони:",
          insertError
        );

        bookingMessage.textContent =
          "НЕ УДАЛОСЬ СОЗДАТЬ БРОНЬ";

        bookingPayButton.disabled = false;

        if (bookingPayText) {
          bookingPayText.textContent =
            `ОПЛАТИТЬ ${Number(GAME_PRICE).toLocaleString("ru-RU")} ₽`;
        }

        return;
      }


      console.log(
        "Бронь создана:",
        orderNumber
      );


      // =========================
      // ПЕРЕХОД К ОПЛАТЕ
      // =========================

      bookingMessage.textContent =
        "ПЕРЕХОДИМ К ОПЛАТЕ...";

      if (bookingPayText) {
        bookingPayText.textContent =
          "ПЕРЕХОД К ОПЛАТЕ...";
      }


// Запоминаем номер брони перед переходом в PayKeeper
localStorage.setItem(
  "jaxLastBookingOrder",
  orderNumber
);

// Передаём в PayKeeper именно
// данные из заполненной формы
goToPayKeeper(
        orderNumber,
        user,
        {
          name: guestName,
          phone: guestPhone,
          email: guestEmail
        }
      );

    }
  );

}