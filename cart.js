const cartItemsContainer =
  document.getElementById('cartItems');

const cartEmpty =
  document.getElementById('cartEmpty');

const cartSummary =
  document.getElementById('cartSummary');

const cartTotal =
  document.getElementById('cartTotal');

const checkoutButton =
  document.querySelector('.cart-checkout-button');


/* =========================
   КОРЗИНА
========================= */

function getCart() {

  try {

    const items = JSON.parse(localStorage.getItem('jaxCart')) || [];
    return Array.isArray(items) ? items.map(item => ({
      ...item,
      price: item.name === 'Медведь' ? 12000 :
        (item.name === 'Лев' || item.name === 'Тигр') ? 15000 : item.price
    })) : [];

  } catch {

    return [];

  }

}


function saveCart(cart) {

  localStorage.setItem(
    'jaxCart',
    JSON.stringify(cart)
  );

}


function formatPrice(price) {

  return Number(price)
    .toLocaleString('ru-RU') + ' ₽';

}


/* =========================
   ОТОБРАЖЕНИЕ КОРЗИНЫ
========================= */

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


  cart.forEach((item, index) => {

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
          data-index="${index}"
          aria-label="Удалить товар"
        >
          ×
        </button>

      </div>
    `;


    cartItemsContainer.appendChild(card);

  });


  const total =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.price),
      0
    );


  cartTotal.textContent =
    formatPrice(total);


  const removeButtons =
    document.querySelectorAll(
      '.cart-remove-button'
    );


  removeButtons.forEach(button => {

    button.addEventListener(
      'click',
      () => {

        const index =
          Number(button.dataset.index);

        const newCart =
          getCart();

        newCart.splice(index, 1);

        saveCart(newCart);

        renderCart();

      }
    );

  });

}


renderCart();


// Временная версия: оформление заказов отключено.
if (checkoutButton) {
  checkoutButton.disabled = true;
  checkoutButton.textContent = "ОФОРМЛЕНИЕ ВРЕМЕННО НЕДОСТУПНО";
}
