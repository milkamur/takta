/* =========================
   SETTINGS
========================= */

const profileNameInput =
  document.getElementById('profileNameInput');

const saveProfileNameBtn =
  document.getElementById('saveProfileNameBtn');



const settingsLogoutBtn =
  document.getElementById('settingsLogoutBtn');


async function loadSettings() {

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = 'index.html';
    return;
  }


  const nickname =
    user.user_metadata?.nickname || '';

  profileNameInput.value =
    nickname;
}

saveProfileNameBtn.addEventListener(
  'click',
  async () => {

    const nickname =
      profileNameInput.value.trim();


    if (!nickname) {
      return;
    }


    saveProfileNameBtn.disabled = true;

    saveProfileNameBtn.textContent =
      'СОХРАНЯЕМ...';


    const {
      error
    } = await supabaseClient.auth.updateUser({

      data: {
        nickname: nickname
      }

    });


    if (error) {

      console.error(error);

      saveProfileNameBtn.textContent =
        'ОШИБКА';

      saveProfileNameBtn.disabled = false;

      return;
    }


    saveProfileNameBtn.textContent =
      'СОХРАНЕНО ✓';

    saveProfileNameBtn.classList.add(
      'is-saved'
    );


    setTimeout(() => {

      saveProfileNameBtn.textContent =
        'СОХРАНИТЬ НИК';

      saveProfileNameBtn.classList.remove(
        'is-saved'
      );

      saveProfileNameBtn.disabled = false;

    }, 1800);

  }
);


settingsLogoutBtn.addEventListener(
  'click',
  async () => {

    await supabaseClient.auth.signOut();

    window.location.href =
      'index.html';

  }
);


loadSettings();