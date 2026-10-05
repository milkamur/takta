const authBox = document.querySelector(".auth-box");
const profileBox = document.getElementById("profileBox");

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
              "custom:telegram",

              options: {

                redirectTo:
                  `${window.location.origin}/account.html${window.location.search || ""}`
              
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
   REDIRECT ПОСЛЕ TELEGRAM
============================== */

function getSafeAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const requestedRedirect = params.get("redirect");

  if (
    requestedRedirect &&
    /^[a-zA-Z0-9_-]+\.html(?:[?#].*)?$/.test(requestedRedirect)
  ) {
    return requestedRedirect;
  }

  return null;
}

function redirectAfterTelegramAuth() {
  const target = getSafeAuthRedirect();

  if (target) {
    window.location.replace(target);
    return true;
  }

  return false;
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

    // Если пользователь пришёл через «Вступить в игру»,
    // после возврата из Telegram сразу отправляем на бронь.
    if (redirectAfterTelegramAuth()) {
      return;
    }

    // Показываем кабинет сразу. Сетевые запросы не должны
    // задерживать восстановление уже существующей сессии.
    showProfile(session.user);

    // Брони загружаем сразу после восстановления сессии.
    loadBookings().catch((error) => {
      console.error("Ошибка загрузки броней:", error);
    });

    // Синхронизация профиля идёт в фоне.
    syncProfile(session.user).catch((error) => {
      console.error("Ошибка синхронизации профиля:", error);
    });

  } else {

    showAuth();

  }

}


checkUserSession();

// Следим за реальным состоянием Supabase-сессии.
// TOKEN_REFRESHED не должен выбрасывать пользователя из кабинета.
let lastRenderedUserId = null;

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    if (redirectAfterTelegramAuth()) {
      return;
    }

    if (lastRenderedUserId !== session.user.id) {
      lastRenderedUserId = session.user.id;
      showProfile(session.user);
      loadBookings().catch((error) => {
        console.error("Ошибка загрузки броней:", error);
      });
    }
    return;
  }

  if (event === "SIGNED_OUT") {
    lastRenderedUserId = null;
    showAuth();
  }
});


/* ==============================
   ВЫХОД
============================== */

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      await supabaseClient.auth
        .signOut();

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

    // Повторная оплата всегда использует цену именно этой брони,
    // а не цену другой текущей активной игры.
    const gamePrice = Number(booking.price).toFixed(2);

    if (!Number.isFinite(Number(booking.price))) {
      console.error("У брони некорректная цена:", booking.price);
      alert("Не удалось определить стоимость брони.");
      return;
    }

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

      bookingList.classList.toggle("open");

      if (bookingList.classList.contains("open")) {
        loadBookings().catch((error) => {
          console.error("Ошибка обновления броней:", error);
        });
      }

    }
  );

}


