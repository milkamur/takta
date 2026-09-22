const floatingCart =
  document.getElementById('floatingCart');

const floatingCartText =
  document.getElementById('floatingCartText');


function getFloatingCart() {
  return JSON.parse(
    localStorage.getItem('jaxCart')
  ) || [];
}


function getCartWord(count) {

  const mod10 = count % 10;
  const mod100 = count % 100;

  if (
    mod10 === 1 &&
    mod100 !== 11
  ) {
    return 'ТОВАР';
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    !(mod100 >= 12 && mod100 <= 14)
  ) {
    return 'ТОВАРА';
  }

  return 'ТОВАРОВ';
}


function updateFloatingCart() {

  const cart = getFloatingCart();
  const count = cart.length;

  if (!floatingCart) {
    return;
  }

  if (count > 0) {

    floatingCartText.textContent =
      `КОРЗИНА · ${count} ${getCartWord(count)}`;

    floatingCart.classList.add(
      'is-visible'
    );

  } else {

    floatingCart.classList.remove(
      'is-visible'
    );

  }
}


updateFloatingCart();


window.addEventListener(
  'storage',
  updateFloatingCart
);

/* =========================
   ВКЛАДКИ МАГАЗИНА
========================= */

const shopTabButtons =
  document.querySelectorAll('[data-shop-tab]');

const masksSection =
  document.getElementById('masksSection');

const featuresSection =
  document.getElementById('featuresSection');


shopTabButtons.forEach(button => {

  button.addEventListener('click', () => {

    const selectedTab =
      button.dataset.shopTab;


    shopTabButtons.forEach(tabButton => {
      tabButton.classList.remove('is-active');
    });


    button.classList.add('is-active');


    if (selectedTab === 'masks') {

      masksSection.hidden = false;
      featuresSection.hidden = true;

    }


    if (selectedTab === 'features') {

      masksSection.hidden = true;
      featuresSection.hidden = false;

    }

  });

});

/* =========================
   УНИКАЛЬНЫЙ НИК
========================= */

const nicknameDetailsBtn =
  document.getElementById('nicknameDetailsBtn');

const nicknameFeature =
  document.getElementById('nicknameFeature');


if (nicknameDetailsBtn) {

  nicknameDetailsBtn.addEventListener('click', event => {

    event.stopPropagation();

    window.location.href =
      'nickname.html';

  });

}


if (nicknameFeature) {

  nicknameFeature.addEventListener('click', () => {

    window.location.href =
      'nickname.html';

  });

}