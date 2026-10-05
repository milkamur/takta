const burgerBtn = document.getElementById("burgerBtn");
const burgerMenu = document.getElementById("burgerMenu");
const burgerClose = document.getElementById("burgerClose");

if (burgerBtn && burgerMenu) {
  burgerBtn.addEventListener("click", () => {
    burgerMenu.classList.add("active");
  });
}

if (burgerClose && burgerMenu) {
  burgerClose.addEventListener("click", () => {
    burgerMenu.classList.remove("active");
  });
}

const joinGameBtn = document.getElementById("joinGameBtn");

if (joinGameBtn) {
  joinGameBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    const {
      data: { session }
    } = await supabaseClient.auth.getSession();

    if (session?.user) {
      window.location.href = "booking.html";
    } else {
      window.location.href = "account.html?mode=register&redirect=booking.html";
    }
  });
}

/* =========================
   JAX INTRO VIDEO
========================= */

const jaxIntro =
  document.getElementById("jaxIntro");

const jaxIntroVideo =
  document.getElementById("jaxIntroVideo");

if (jaxIntro && jaxIntroVideo) {

  let introFinished = false;
  let startTimer = null;

  const hideIntro = () => {
    if (introFinished) return;

    introFinished = true;

    if (startTimer) {
      clearTimeout(startTimer);
    }

    jaxIntro.classList.add("is-hidden");

    setTimeout(() => {
      jaxIntro.remove();
    }, 500);
  };

  // Если заставку уже показывали в этой вкладке,
  // второй раз её не запускаем.
  const introAlreadyShown =
    sessionStorage.getItem("jaxIntroShown") === "1";

  // Если пользователь вернулся на главную
  // с другой страницы JAX, заставку тоже пропускаем.
  let cameFromJaxPage = false;

  if (document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      const current = new URL(window.location.href);

      cameFromJaxPage =
        referrer.origin === current.origin &&
        referrer.pathname !== current.pathname;
    } catch (error) {
      cameFromJaxPage = false;
    }
  }

  if (introAlreadyShown || cameFromJaxPage) {
    jaxIntro.remove();
  } else {
    // Для мобильных браузеров эти свойства должны
    // быть установлены и в HTML, и непосредственно
    // перед попыткой воспроизведения.
    jaxIntroVideo.muted = true;
    jaxIntroVideo.defaultMuted = true;
    jaxIntroVideo.playsInline = true;

    jaxIntroVideo.addEventListener(
      "playing",
      () => {
        sessionStorage.setItem("jaxIntroShown", "1");

        if (startTimer) {
          clearTimeout(startTimer);
          startTimer = null;
        }
      },
      { once: true }
    );

    jaxIntroVideo.addEventListener(
      "ended",
      hideIntro,
      { once: true }
    );

    jaxIntroVideo.addEventListener(
      "error",
      hideIntro,
      { once: true }
    );

    // Не держим человека на заставке, если браузер
    // не начал воспроизведение достаточно быстро.
    startTimer = setTimeout(() => {
      if (jaxIntroVideo.paused) {
        hideIntro();
      }
    }, 1500);

    // Явно просим браузер запустить видео.
    // Если autoplay запрещён — сразу открываем сайт,
    // без кнопки Play и без зависшей заставки.
    const playPromise = jaxIntroVideo.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        hideIntro();
      });
    }
  }
}
