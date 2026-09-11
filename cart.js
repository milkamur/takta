const cartItemsContainer =
  document.getElementById('cartItems');

const cartEmpty =
  document.getElementById('cartEmpty');

const cartSummary =
  document.getElementById('cartSummary');

const cartTotal =
  document.getElementById('cartTotal');


function getCart() {
  return JSON.parse(localStorage.getItem('jaxCart')) || [];
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
        <img src="${item.image}" alt="${item.name}">
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


  const total = cart.reduce(
    (sum, item) => sum + item.price,
    0
  );

  cartTotal.textContent =
    formatPrice(total);


  const removeButtons =
    document.querySelectorAll('.cart-remove-button');

  removeButtons.forEach(button => {

    button.addEventListener('click', () => {

      const productName =
        button.dataset.name;

      const newCart =
        getCart().filter(
          item => item.name !== productName
        );

      saveCart(newCart);

      renderCart();

    });

  });

}


renderCart();