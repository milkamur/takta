const authBox = document.querySelector(".auth-box");
const profileBox = document.getElementById("profileBox");

const phoneForm = document.getElementById("phoneForm");
const authPhone = document.getElementById("authPhone");

const privacyConsent = document.getElementById("privacyConsent");

const telegramLoginBtn = document.getElementById("telegramLoginBtn");

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");

const logoutBtn = document.getElementById("logoutBtn");


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

  if (digits.length === 11 && digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  }

  if (digits.length === 10) {
    digits = "7" + digits;
  }

  if (digits.length !== 11 || !digits.startsWith("7")) {
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
    authPhone.value = formatPhoneInput(authPhone.value);
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
  const digits = phone.replace(/\D/g, "");

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
   TELEGRAM
   ПОКА ЗАГЛУШКА
============================== */

if (telegramLoginBtn) {
    telegramLoginBtn.addEventListener("click", async () => {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "custom:telegram",
        options: {
          redirectTo: "https://milkamur.github.io/takta/account.html"
        }
      });
  
      if (error) {
        console.error("Telegram login error:", error);
        alert("Не удалось открыть вход через Telegram");
      }
    });
  }


/* ==============================
   ВРЕМЕННЫЙ ВХОД ПО ТЕЛЕФОНУ
   БЕЗ SMS
============================== */

if (phoneForm) {

  phoneForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const phone = normalizePhone(authPhone.value);

    if (!phone) {
      alert("Введите корректный номер телефона");
      return;
    }


    /* Проверяем согласие */

    if (!privacyConsent.checked) {

      const consent =
        document.querySelector(".auth-consent");

      consent?.classList.add("consent-error");

      setTimeout(() => {
        consent?.classList.remove("consent-error");
      }, 2000);

      return;
    }


    const button =
      phoneForm.querySelector(".auth-submit");

    const buttonText =
      button.querySelector(".auth-submit-text");


    button.disabled = true;
    buttonText.textContent = "ВХОДИМ...";


    /*
      Создаём временного анонимного
      пользователя Supabase.
    */

    const {
      data,
      error
    } = await supabaseClient.auth.signInAnonymously();


    if (error) {

      console.error(error);

      button.disabled = false;
      buttonText.textContent = "ВОЙТИ";

      alert(
        "Не удалось войти. Проверь настройки Supabase."
      );

      return;
    }


    /*
      Сохраняем введённый телефон
      в metadata.

      ВАЖНО:
      телефон пока НЕ подтверждён.
    */

    const {
      data: updatedData,
      error: updateError
    } = await supabaseClient.auth.updateUser({
      data: {
        phone_unverified: phone,
        name: "ИГРОК",
        login_method: "phone_unverified"
      }
    });


    if (updateError) {
      console.error(updateError);
    }


    /*
      Дополнительная локальная копия,
      чтобы номер точно отображался
      в интерфейсе.
    */

    localStorage.setItem(
      "takta_phone",
      phone
    );


    button.disabled = false;
    buttonText.textContent = "ВОЙТИ";


    const user =
      updatedData?.user ||
      data?.user;


    if (user) {

      showProfile(user);

      await loadBookings();

    }

  });

}


/* ==============================
   ПОКАЗАТЬ ПРОФИЛЬ
============================== */

function showProfile(user) {

  authBox.style.display = "none";

  profileBox.classList.add("active");


  /*
    Настоящий подтверждённый телефон
    появится позже.

    Пока берём временный номер
    из metadata / localStorage.
  */

  const phone =
    user.phone ||
    user.user_metadata?.phone_unverified ||
    localStorage.getItem("takta_phone") ||
    "";


  if (profileEmail) {

    profileEmail.textContent =
      phone
        ? formatPhone(phone)
        : "";

  }


  const name =
    user.user_metadata?.name ||
    "ИГРОК";


  if (profileName) {
    profileName.textContent =
      name.toUpperCase();
  }

}


/* ==============================
   ПОКАЗАТЬ ЭКРАН ВХОДА
============================== */

function showAuth() {

  profileBox.classList.remove("active");

  authBox.style.display = "block";

}


/* ==============================
   ПРОВЕРКА СЕССИИ
============================== */

async function checkUserSession() {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();


  if (session?.user) {

    showProfile(session.user);

    await loadBookings();

  } else {

    showAuth();

  }

}


checkUserSession();


/* ==============================
   ВЫХОД
============================== */

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    localStorage.removeItem("takta_phone");

    if (authPhone) {
      authPhone.value = "+7 ";
    }

    if (privacyConsent) {
      privacyConsent.checked = false;
    }

    showAuth();

  });

}


/* ==============================
   ЗАГРУЗКА БРОНЕЙ
============================== */

async function loadBookings() {

  const bookingList =
    document.getElementById("bookingList");

  if (!bookingList) return;


  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (!session?.user) return;


  const {
    data,
    error
  } = await supabaseClient
    .from("bookings")
    .select("*")
    .eq("user_id", session.user.id)
    .order("game_date", {
      ascending: true
    });


  if (error) {

    console.error(error);

    return;

  }


  bookingList.innerHTML = "";


  if (!data || data.length === 0) {

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
      new Date(booking.game_date);


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


    let statusText =
      "ОЖИДАЕТ ПОДТВЕРЖДЕНИЯ";


    if (
      booking.status === "confirmed"
    ) {
      statusText = "ПОДТВЕРЖДЕНО";
    }


    const item =
      document.createElement("div");


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

      <div class="booking-item-status">
        ${statusText}
      </div>

    `;


    bookingList.appendChild(item);

  });

}


/* ==============================
   ОТКРЫТИЕ / ЗАКРЫТИЕ БРОНЕЙ
============================== */

const bookingsBtn =
  document.getElementById("bookingsBtn");

const bookingList =
  document.getElementById("bookingList");


if (
  bookingsBtn &&
  bookingList
) {

  bookingsBtn.addEventListener(
    "click",
    () => {

      bookingList.classList.toggle("open");

    }
  );

}
