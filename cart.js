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

// =========================
// ОФОРМЛЕНИЕ ЗАКАЗА
// =========================

const checkoutButton =
  document.querySelector('.cart-checkout-button');


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
        'РЕЗЕРВИРУЕМ...';


      try {

        // =========================
        // РЕЗЕРВИРУЕМ МАСКИ
        // =========================

        for (const item of cart) {

          if (!item.productId) {
            throw new Error(
              `У товара ${item.name} отсутствует productId`
            );
          }


          const {
            data,
            error
          } =
            await supabaseClient.rpc(
              'reserve_product',
              {
                p_product_id:
                  item.productId
              }
            );


          if (error) {
            throw error;
          }


          console.log(
            'Товар зарезервирован:',
            data
          );
        }


// =========================
// СОЗДАЁМ ЗАКАЗ
// =========================

const totalAmount = cart.reduce(
  (sum, item) => sum + item.price,
  0
);

const orderNumber =
  'JAX-' +
  Date.now();

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
      status: 'pending'
    })
    .select()
    .single();


if (orderError) {
  throw orderError;
}

console.log(
  'Заказ создан:',
  order
);


// =========================
// ДОБАВЛЯЕМ ТОВАРЫ В ЗАКАЗ
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
// УСПЕХ
// =========================

checkoutButton.textContent =
  'ЗАКАЗ СОЗДАН';

console.log(
  'Заказ полностью создан:',
  orderNumber
);


      } catch (error) {

        console.error(
          'Ошибка резервирования:',
          error
        );


        // Если товар уже забрал другой человек
        if (
          error.message?.includes(
            'PRODUCT_NOT_AVAILABLE'
          )
        ) {

          alert(
            'Одна из масок уже находится в резерве или продана.'
          );

        } else {

          alert(
            'Не удалось зарезервировать товар. Попробуйте ещё раз.'
          );
        }


        checkoutButton.disabled = false;

        checkoutButton.textContent =
          'ОФОРМИТЬ ЗАКАЗ';
      }

    }
  );
}