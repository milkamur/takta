const authBox = document.querySelector(".auth-box");
const profileBox = document.getElementById("profileBox");

const phoneForm = document.getElementById("phoneForm");
const authPhone = document.getElementById("authPhone");

const privacyConsent =
  document.getElementById("privacyConsent");

const telegramLoginBtn =
  document.getElementById("telegramLoginBtn");

const profileName =
  document.getElementById("profileName");

const profileEmail =
  document.getElementById("profileEmail");

const logoutBtn =
  document.getElementById("logoutBtn");

const settingsButton =
  document.getElementById("settingsButton");


/* ==============================
   СОГЛАСИЕ
============================== */

if (privacyConsent) {

  privacyConsent.addEventListener("change", () => {

    if (privacyConsent.checked) {

      document
        .querySelector(".auth-consent")
        ?.classList.remove("consent-error");

    }

  });

}


/* ==============================
   НОРМАЛИЗАЦИЯ НОМЕРА
============================== */

function normalizePhone(value) {

  let digits = value.replace(/\D/g, "");

  if (
    digits.length === 11 &&
    digits.startsWith("8")
  ) {
    digits = "7" + digits.slice(1);
  }

  if (digits.length === 10) {
    digits = "7" + digits;
  }

  if (
    digits.length !== 11 ||
    !digits.startsWith("7")
  ) {
    return null;
  }

  return "+" + digits;
}


/* ==============================
   ФОРМАТИРОВАНИЕ ПОЛЯ
============================== */

function formatPhoneInput(value) {

  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  }

  if (!digits.startsWith("7")) {
    digits = "7" + digits;
  }

  digits = digits.slice(0, 11);

  const number = digits.slice(1);

  let result = "+7";

  if (number.length > 0) {
    result += " " + number.slice(0, 3);
  }

  if (number.length >= 4) {
    result += " " + number.slice(3, 6);
  }

  if (number.length >= 7) {
    result += "-" + number.slice(6, 8);
  }

  if (number.length >= 9) {
    result += "-" + number.slice(8, 10);
  }

  return result;
}


if (authPhone) {

  authPhone.addEventListener("input", () => {

    authPhone.value =
      formatPhoneInput(authPhone.value);

  });


  authPhone.addEventListener("focus", () => {

    if (
      !authPhone.value ||
      authPhone.value.trim() === "+7"
    ) {
      authPhone.value = "+7 ";
    }

  });


  authPhone.addEventListener("blur", () => {

    if (
      !authPhone.value ||
      authPhone.value.trim() === "+7"
    ) {
      authPhone.value = "+7 ";
    }

  });

}


/* ==============================
   КРАСИВО ПОКАЗАТЬ НОМЕР
============================== */

function formatPhone(phone) {

  const digits =
    String(phone).replace(/\D/g, "");

  if (digits.length !== 11) {
    return phone;
  }

  return (
    `+7 ${digits.slice(1, 4)} ` +
    `${digits.slice(4, 7)}-` +
    `${digits.slice(7, 9)}-` +
    `${digits.slice(9, 11)}`
  );

}


/* ==============================
   СОХРАНЕНИЕ ПРОФИЛЯ
   В ТАБЛИЦУ profiles
============================== */

async function syncProfile(user) {

  if (!user) return null;

  const meta =
    user.user_metadata || {};

  const identities =
    user.identities || [];


  /* =========================
     TELEGRAM
  ========================= */

  const telegramIdentity =
    identities.find((identity) => {

      const provider =
        String(identity.provider || "")
          .toLowerCase();

      return provider.includes("telegram");

    });


  const telegramData =
    telegramIdentity?.identity_data || {};


  /*
    Telegram username.

    Проверяем несколько вариантов,
    потому что название поля зависит
    от того, что именно вернул provider.
  */

  let telegramUsername =
    telegramData.username ||
    telegramData.user_name ||
    telegramData.preferred_username ||
    meta.telegram_username ||
    meta.username ||
    meta.user_name ||
    meta.preferred_username ||
    null;


  if (telegramUsername) {

    telegramUsername =
      String(telegramUsername)
        .replace(/^@/, "")
        .trim();

  }


  /*
    Telegram ID
  */

  const telegramId =
    telegramData.id ||
    telegramData.sub ||
    telegramData.provider_id ||
    telegramIdentity?.id ||
    meta.telegram_id ||
    meta.provider_id ||
    (
      String(meta.iss || "")
        .toLowerCase()
        .includes("telegram")
        ? meta.sub
        : null
    ) ||
    null;


  /* =========================
     ИМЯ
  ========================= */

  const firstName =
    telegramData.first_name ||
    meta.first_name ||
    "";

  const lastName =
    telegramData.last_name ||
    meta.last_name ||
    "";

  const telegramFullName =
    `${firstName} ${lastName}`.trim();


  const name =
    telegramFullName ||
    telegramData.full_name ||
    telegramData.name ||
    meta.full_name ||
    meta.name ||
    meta.nickname ||
    telegramUsername ||
    null;


  /* =========================
     ТЕЛЕФОН
  ========================= */

  const phone =
    user.phone ||
    meta.phone ||
    meta.phone_unverified ||
    localStorage.getItem("takta_phone") ||
    null;


  /* =========================
     EMAIL
  ========================= */

  const email =
    user.email ||
    meta.email ||
    telegramData.email ||
    null;


  /* =========================
     СОХРАНЯЕМ
  ========================= */

  const profileData = {

    user_id: user.id,

    name:
      name && name !== "ИГРОК"
        ? name
        : null,

    telegram_username:
      telegramUsername,

    telegram_id:
      telegramId
        ? String(telegramId)
        : null,

    phone:
      phone,

    email:
      email,

    updated_at:
      new Date().toISOString()

  };


  console.log(
    "JAX profile sync:",
    profileData
  );


  const {
    data,
    error
  } = await supabaseClient
    .from("profiles")
    .upsert(
      profileData,
      {
        onConflict: "user_id"
      }
    )
    .select()
    .single();


  if (error) {

    console.error(
      "Ошибка сохранения профиля:",
      error
    );

    return null;

  }


  console.log(
    "Профиль JAX сохранён:",
    data
  );

  return data;

}


/* ==============================
   TELEGRAM
============================== */

if (telegramLoginBtn) {

  telegramLoginBtn.addEventListener(
    "click",
    async () => {

      // Проверяем согласие
      if (
        privacyConsent &&
        !privacyConsent.checked
      ) {

        const consent =
          document.querySelector(
            ".auth-consent"
          );

        consent?.classList.add(
          "consent-error"
        );

        setTimeout(() => {

          consent?.classList.remove(
            "consent-error"
          );

        }, 2000);

        return;

      }


      // Вход через Telegram
      const { error } =
        await supabaseClient.auth
          .signInWithOAuth({

            provider:
              "custom:telegram-jax",

              options: {

                redirectTo:
                  "https://jaxmafia.ru/index.html"
              
              }

          });


      if (error) {

        console.error(
          "Telegram login error:",
          error
        );

        alert(
          "Не удалось открыть вход через Telegram"
        );

      }

    }
  );

}


/* ==============================
   ВРЕМЕННЫЙ ВХОД ПО ТЕЛЕФОНУ
   БЕЗ SMS
============================== */

if (phoneForm) {

  phoneForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const phone =
        normalizePhone(
          authPhone.value
        );


      if (!phone) {

        alert(
          "Введите корректный номер телефона"
        );

        return;

      }


      /* Проверяем согласие */

      if (
        privacyConsent &&
        !privacyConsent.checked
      ) {

        const consent =
          document.querySelector(
            ".auth-consent"
          );

        consent?.classList.add(
          "consent-error"
        );

        setTimeout(() => {

          consent?.classList.remove(
            "consent-error"
          );

        }, 2000);

        return;

      }


      const button =
        phoneForm.querySelector(
          ".auth-submit"
        );

      const buttonText =
        button?.querySelector(
          ".auth-submit-text"
        );


      if (button) {
        button.disabled = true;
      }

      if (buttonText) {
        buttonText.textContent =
          "ВХОДИМ...";
      }


      /*
        Пока сохраняем существующую
        логику входа по телефону:
        создаём анонимного пользователя.
      */

      const {
        data,
        error
      } =
        await supabaseClient.auth
          .signInAnonymously();


      if (error) {

        console.error(error);

        if (button) {
          button.disabled = false;
        }

        if (buttonText) {
          buttonText.textContent =
            "ВОЙТИ";
        }

        alert(
          "Не удалось войти. Проверь настройки Supabase."
        );

        return;

      }


      /*
        Сохраняем телефон в metadata.
        Пока номер не подтверждён SMS.
      */

      const {
        data: updatedData,
        error: updateError
      } =
        await supabaseClient.auth
          .updateUser({

            data: {

              phone_unverified:
                phone,

              name:
                "ИГРОК",

              login_method:
                "phone_unverified"

            }

          });


      if (updateError) {

        console.error(
          updateError
        );

      }


      /*
        Локальная копия телефона.
      */

      localStorage.setItem(
        "takta_phone",
        phone
      );


      if (button) {
        button.disabled = false;
      }

      if (buttonText) {
        buttonText.textContent =
          "ВОЙТИ";
      }


      const user =
        updatedData?.user ||
        data?.user;


        if (user) {

          // Сохраняем пользователя
          // в таблицу profiles
        
          await syncProfile(user);
        
          // После регистрации / входа возвращаем пользователя
          // туда, откуда он пришёл.
          // Например: ВСТУПИТЬ В ИГРУ -> booking.html.
          // Обычный вход в личный кабинет -> account.html.

          const params = new URLSearchParams(window.location.search);
          const requestedRedirect = params.get("redirect");

          // Разрешаем только локальные HTML-страницы JAX,
          // чтобы параметр redirect нельзя было использовать
          // для перехода на посторонний сайт.
          const safeRedirect =
            requestedRedirect &&
            /^[a-zA-Z0-9_-]+\.html(?:[?#].*)?$/.test(requestedRedirect)
              ? requestedRedirect
              : "account.html";

          window.location.href = safeRedirect;

          return;
        }

    }
  );

}


/* ==============================
   ПОКАЗАТЬ ПРОФИЛЬ
============================== */

function showProfile(user) {

  const adminProfileCard =
  document.getElementById(
    "adminProfileCard"
  );

const ADMIN_USER_ID =
  "850be360-1346-4ddc-88bd-3670835272b9";


if (adminProfileCard) {

  if (user.id === ADMIN_USER_ID) {

    adminProfileCard.style.display =
      "";

  } else {

    adminProfileCard.style.display =
      "none";

  }

}

  if (authBox) {
    authBox.style.display = "none";
  }

  if (profileBox) {
    profileBox.classList.add("active");
  }

  if (settingsButton) {
    settingsButton.style.display =
      "block";
  }


  const phone =
    user.phone ||
    user.user_metadata?.phone ||
    user.user_metadata?.phone_unverified ||
    localStorage.getItem(
      "takta_phone"
    ) ||
    "";


  if (profileEmail) {

    if (phone) {

      profileEmail.textContent =
        formatPhone(phone);

    } else if (user.email) {

      profileEmail.textContent =
        user.email;

    } else {

      profileEmail.textContent = "";

    }

  }


  const meta =
    user.user_metadata || {};


  const firstName =
    meta.first_name || "";

  const lastName =
    meta.last_name || "";

  const fullTelegramName =
    `${firstName} ${lastName}`.trim();


  const name =
    fullTelegramName ||
    meta.full_name ||
    meta.nickname ||
    meta.name ||
    meta.username ||
    meta.user_name ||
    "ИГРОК";


  if (profileName) {

    profileName.textContent =
      String(name).toUpperCase();

  }

}


/* ==============================
   ПОКАЗАТЬ ЭКРАН ВХОДА
============================== */

function showAuth() {

  if (profileBox) {
    profileBox.classList.remove(
      "active"
    );
  }

  if (authBox) {
    authBox.style.display =
      "block";
  }

  if (settingsButton) {
    settingsButton.style.display =
      "none";
  }

}


/* ==============================
   ПРОВЕРКА СЕССИИ
============================== */

async function checkUserSession() {

  const {
    data: { session }
  } =
    await supabaseClient.auth
      .getSession();


  if (session?.user) {

    /*
      НОВОЕ:
      каждый раз после входа
      синхронизируем профиль.
    */

    await syncProfile(
      session.user
    );

    showProfile(
      session.user
    );

  } else {

    showAuth();

  }

}


checkUserSession();


/* ==============================
   ВЫХОД
============================== */

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      await supabaseClient.auth
        .signOut();

      localStorage.removeItem(
        "takta_phone"
      );

      if (authPhone) {
        authPhone.value = "+7 ";
      }

      if (privacyConsent) {
        privacyConsent.checked =
          false;
      }

      showAuth();

    }
  );

}

// =========================
// ПОВТОРНАЯ ОПЛАТА БРОНИ
// =========================

async function repeatBookingPayment(bookingId) {

  try {

    // Получаем бронь
    const {
      data: booking,
      error: bookingError
    } = await supabaseClient
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error(
        "Не удалось получить бронь:",
        bookingError
      );

      alert("Не удалось подготовить оплату.");
      return;
    }


    // Получаем текущего пользователя
    const {
      data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session?.user) {
      alert("Необходимо войти в аккаунт.");
      return;
    }

    const user = session.user;


    // Получаем профиль
    const {
      data: profile,
      error: profileError
    } = await supabaseClient
      .from("profiles")
      .select(
        "name, telegram_username, phone, email"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Ошибка получения профиля:",
        profileError
      );
    }


    // Номер заказа уже должен быть у брони
    const orderNumber = booking.order_number;

    if (!orderNumber) {
      console.error(
        "У брони отсутствует order_number"
      );

      alert("Не удалось определить номер заказа.");
      return;
    }

    // Получаем актуальную цену игры
const {
  data: game,
  error: gameError
} = await supabaseClient
  .from("games")
  .select("price")
  .eq("is_active", true)
  .limit(1)
  .maybeSingle();

if (gameError || !game) {
  console.error(
    "Не удалось получить цену игры:",
    gameError
  );

  alert("Не удалось определить стоимость игры.");
  return;
}

const gamePrice =
  Number(game.price).toFixed(2);

    // Данные клиента
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


    // Создаём форму PayKeeper
    const form = document.createElement("form");

    form.method = "POST";
    form.action =
      "https://club241640526-vk.server.paykeeper.ru/create/";


      const fields = {
        sum: gamePrice,
      orderid: orderNumber,
      clientid: clientName,
      service_name: "Бронирование игры JAX",
      client_email: clientEmail,
      client_phone: clientPhone
    };


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

    form.submit();

  } catch (error) {

    console.error(
      "Ошибка повторной оплаты:",
      error
    );

    alert(
      "Не удалось перейти к оплате."
    );
  }
}

/* ==============================
   ЗАГРУЗКА БРОНЕЙ
============================== */

async function loadBookings() {

  const bookingList =
    document.getElementById(
      "bookingList"
    );

  if (!bookingList) return;


  const {
    data: { session }
  } =
    await supabaseClient.auth
      .getSession();


  if (!session?.user) return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("bookings")
      .select("*")
      .eq(
        "user_id",
        session.user.id
      )
      .order(
        "game_date",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(error);

    return;

  }


  bookingList.innerHTML = "";


  if (
    !data ||
    data.length === 0
  ) {

    bookingList.innerHTML = `
      <div class="booking-item">

        <div class="booking-item-title">
          ПОКА НЕТ АКТИВНЫХ БРОНЕЙ
        </div>

      </div>
    `;

    return;

  }


  data.forEach((booking) => {

    const date =
      new Date(
        booking.game_date +
        "T00:00:00"
      );


    const formattedDate =
      date
        .toLocaleDateString(
          "ru-RU",
          {
            day: "numeric",
            month: "long"
          }
        )
        .toUpperCase();


    /* =========================
       СТАТУС
    ========================= */

    let statusText =
      "ОЖИДАЕТ ОПЛАТЫ";

    let statusClass =
      "pending";

    let paymentButton = "";


    // ОЖИДАЕТ ОПЛАТЫ

    if (
      booking.status ===
      "pending"
    ) {

      statusText =
        "ОЖИДАЕТ ОПЛАТЫ";

      statusClass =
        "pending";

      /*
        Эту старую кнопку пока
        оставляем как в твоём файле.

        Позже заменим её на оплату
        с order_number, чтобы повторная
        оплата тоже правильно
        связывалась с бронью.
      */

        paymentButton = `
        <button
          type="button"
          class="booking-payment-btn"
          onclick="repeatBookingPayment('${booking.id}')"
        >
          ОПЛАТИТЬ
          <span>→</span>
        </button>
      `;

    }


    // ОПЛАЧЕНО

    if (
      booking.status === "paid" ||
      booking.status === "confirmed"
    ) {

      statusText =
        "ОПЛАЧЕНО ✓";

      statusClass =
        "paid";

      paymentButton = "";

    }


    // ОТМЕНЕНО

    if (
      booking.status ===
      "cancelled"
    ) {

      statusText =
        "БРОНЬ ОТМЕНЕНА";

      statusClass =
        "cancelled";

      paymentButton = "";

    }


    /* =========================
       КАРТОЧКА БРОНИ
    ========================= */

    const item =
      document.createElement(
        "div"
      );

    item.className =
      "booking-item";


    item.innerHTML = `

      <div class="booking-item-date">
        ${formattedDate} ·
        ${booking.game_time.slice(0, 5)}
      </div>

      <div class="booking-item-title">
        ${booking.game_title}
      </div>

      <div class="booking-item-status ${statusClass}">
        ${statusText}
      </div>

      ${paymentButton}

    `;


    bookingList.appendChild(
      item
    );

  });

}


/* ==============================
   ОТКРЫТИЕ / ЗАКРЫТИЕ БРОНЕЙ
============================== */

const bookingsBtn =
  document.getElementById(
    "bookingsBtn"
  );

const bookingList =
  document.getElementById(
    "bookingList"
  );


if (
  bookingsBtn &&
  bookingList
) {

  bookingsBtn.addEventListener(
    "click",
    () => {

      bookingList.classList.toggle(
        "open"
      );

    }
  );

}


/* ==============================
   ВХОД ПО НОМЕРУ
============================== */

const phoneLoginToggle =
  document.getElementById(
    "phoneLoginToggle"
  );


if (
  phoneLoginToggle &&
  phoneForm
) {

  phoneLoginToggle.addEventListener(
    "click",
    () => {

      phoneForm.classList.toggle(
        "is-open"
      );

      const isOpen =
        phoneForm.classList.contains(
          "is-open"
        );

      phoneLoginToggle.textContent =
        isOpen
          ? "СКРЫТЬ ВХОД ПО НОМЕРУ"
          : "ВОЙТИ ПО НОМЕРУ ТЕЛЕФОНА";

    }
  );

}