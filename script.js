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
  document.getElementById('jaxIntro');

const jaxIntroVideo =
  document.getElementById('jaxIntroVideo');


if (jaxIntro && jaxIntroVideo) {

  /*
    Проверяем, пришёл ли пользователь
    на главную с другой страницы JAX.
  */

  let cameFromJaxPage = false;

  if (document.referrer) {

    try {

      const referrer =
        new URL(document.referrer);

      const current =
        new URL(window.location.href);

      cameFromJaxPage =
        referrer.origin === current.origin &&
        referrer.pathname !== current.pathname;

    } catch (error) {

      cameFromJaxPage = false;

    }

  }


  /*
    Если вернулись на главную
    с другой страницы сайта —
    заставку не показываем.
  */

  if (cameFromJaxPage) {

    jaxIntro.remove();

  } else {

    /*
      Прямой вход или обновление
      главной страницы —
      показываем заставку.
    */

    jaxIntroVideo.addEventListener(
      'ended',
      () => {

        jaxIntro.classList.add(
          'is-hidden'
        );

        setTimeout(() => {

          jaxIntro.remove();

        }, 500);

      }
    );


    jaxIntroVideo.addEventListener(
      'error',
      () => {

        jaxIntro.remove();

      }
    );

  }

}