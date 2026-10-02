const cartItemsContainer =
  document.getElementById('cartItems');

const cartEmpty =
  document.getElementById('cartEmpty');

const cartSummary =
  document.getElementById('cartSummary');

const cartTotal =
  document.getElementById('cartTotal');


// =========================
// КОРЗИНА
// =========================

function getCart() {
  return JSON.parse(
    localStorage.getItem('jaxCart')
  ) || [];
}


function saveCart(cart) {
  localStorage.setItem(
    'jaxCart',
    JSON.stringify(cart)
  );
}


function formatPrice(price) {
  return price.toLocaleString('ru-RU') + ' ₽';
}


// =========================
// ОТОБРАЖЕНИЕ КОРЗИНЫ
// =========================

function renderCart() {

  const cart = getCart();

  cartItemsContainer.innerHTML = '';

  if (cart.length === 0) {

    cartEmpty.style.display = '';
    cartSummary.style.display = 'none';

    return;
  }

  cartEmpty.style.display = 'none';
  cartSummary.style.display = '';


  cart.forEach(item => {

    const card =
      document.createElement('article');

    card.className = 'cart-item';

    card.innerHTML = `
      <div class="cart-item-image">
        <img
          src="${item.image}"
          alt="${item.name}"
        >
      </div>

      <div class="cart-item-content">

        <span class="cart-item-label">
          МАСКА
        </span>

        <h2 class="cart-item-title">
          ${item.name}
        </h2>

        <p class="cart-item-price">
          ${formatPrice(item.price)}
        </p>

        <button
          class="cart-remove-button"
          type="button"
          data-name="${item.name}"
          aria-label="Удалить товар"
        >
          ×
        </button>

      </div>
    `;

    cartItemsContainer.appendChild(card);

  });


  // =========================
  // ИТОГОВАЯ СУММА
  // =========================

  const total =
    cart.reduce(
      (sum, item) =>
        sum + item.price,
      0
    );

  cartTotal.textContent =
    formatPrice(total);


  // =========================
  // УДАЛЕНИЕ ТОВАРА
  // =========================

  const removeButtons =
    document.querySelectorAll(
      '.cart-remove-button'
    );

  removeButtons.forEach(button => {

    button.addEventListener(
      'click',
      () => {

        const productName =
          button.dataset.name;

        const newCart =
          getCart().filter(
            item =>
              item.name !== productName
          );

        saveCart(newCart);

        renderCart();

      }
    );

  });

}


renderCart();


// =========================
// СВЯЗАТЬСЯ С МЕНЕДЖЕРОМ
// =========================

const checkoutButton =
  document.querySelector(
    '.cart-checkout-button'
  );


if (checkoutButton) {

  checkoutButton.textContent =
    'СВЯЗАТЬСЯ С МЕНЕДЖЕРОМ';


  checkoutButton.addEventListener(
    'click',
    () => {

      const cart = getCart();

      if (cart.length === 0) {
        return;
      }


      // =========================
      // СУММА ЗАКАЗА
      // =========================

      const total =
        cart.reduce(
          (sum, item) =>
            sum + item.price,
          0
        );


      // =========================
      // СПИСОК МАСОК
      // =========================

      const productList =
        cart
          .map(
            item =>
              `${item.name} — ${formatPrice(item.price)}`
          )
          .join('\n');


      // =========================
      // ТЕКСТ ДЛЯ TELEGRAM
      // =========================

      const message =
`Здравствуйте!

Хочу приобрести:

${productList}

Итого: ${formatPrice(total)}`;


      console.log(
        'Сообщение для менеджера:',
        message
      );


      // =========================
      // TELEGRAM
      // =========================

      const telegramUrl =
      'https://t.me/stonedks';


      window.open(
        telegramUrl,
        '_blank'
      );

    }
  );

}