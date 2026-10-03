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

    return JSON.parse(
      localStorage.getItem('jaxCart')
    ) || [];

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


// =========================
// ОФОРМЛЕНИЕ ЗАКАЗА
// =========================

if (checkoutButton) {

  checkoutButton.addEventListener(
    'click',
    async () => {

      const cart = getCart();

      if (cart.length === 0) {
        return;
      }


      // =========================
      // ПРОВЕРЯЕМ АВТОРИЗАЦИЮ
      // =========================

      const {
        data: { session },
        error: sessionError
      } =
        await supabaseClient.auth.getSession();


      if (sessionError || !session?.user) {

        window.location.href =
          'account.html?mode=register&redirect=cart.html';

        return;
      }


      checkoutButton.disabled = true;
      checkoutButton.textContent =
        'ОФОРМЛЯЕМ...';


      try {

        // =========================
        // СОЗДАЁМ ЗАКАЗ
        // =========================

        const totalAmount =
          cart.reduce(
            (sum, item) => sum + item.price,
            0
          );


        const orderNumber =
          'JAX-' + Date.now();


        const {
          data: order,
          error: orderError
        } =
          await supabaseClient
            .from('shop_orders')
            .insert({
              order_number: orderNumber,
              user_id: session.user.id,
              total_amount: totalAmount,
              status: 'new'
            })
            .select()
            .single();


        if (orderError) {
          throw orderError;
        }


        // =========================
        // ДОБАВЛЯЕМ ТОВАРЫ
        // В ЗАКАЗ
        // =========================

        const orderItems =
          cart.map(item => ({
            order_id: order.id,
            product_id: item.productId,
            price: item.price
          }));


        const {
          error: itemsError
        } =
          await supabaseClient
            .from('shop_order_items')
            .insert(orderItems);


        if (itemsError) {
          throw itemsError;
        }


        // =========================
        // ОЧИЩАЕМ КОРЗИНУ
        // =========================

        localStorage.removeItem('jaxCart');


        // =========================
        // ОТКРЫВАЕМ СТРАНИЦУ УСПЕХА
        // =========================

        window.location.href =
          `order-success.html?order=${encodeURIComponent(orderNumber)}`;


      } catch (error) {

        console.error(
          'Ошибка оформления заказа:',
          error
        );


        alert(
          'Не удалось оформить заказ. Попробуйте ещё раз.'
        );


        checkoutButton.disabled = false;
        checkoutButton.textContent =
          'ОФОРМИТЬ ЗАКАЗ';
      }

    }
  );
}