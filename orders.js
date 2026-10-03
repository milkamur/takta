document.addEventListener("DOMContentLoaded", async () => {

  const loading = document.getElementById("ordersLoading");
  const list = document.getElementById("ordersList");
  const empty = document.getElementById("ordersEmpty");


  try {

    // =========================
    // ПРОВЕРЯЕМ АВТОРИЗАЦИЮ
    // =========================

    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();


    if (userError) {
      throw userError;
    }


    if (!user) {
      window.location.href = "account.html";
      return;
    }


    // =========================
    // ПОЛУЧАЕМ ЗАЯВКИ НА НИК
    // =========================

    const {
      data: nicknameOrders,
      error: nicknameError
    } = await supabaseClient
      .from("nickname_orders")
      .select(`
        id,
        created_at,
        nickname,
        comment,
        price,
        status
      `)
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false
      });


    if (nicknameError) {
      throw nicknameError;
    }


    // =========================
    // ПОЛУЧАЕМ ЗАКАЗЫ МАГАЗИНА
    // =========================

    const {
      data: shopOrders,
      error: shopError
    } = await supabaseClient
      .from("shop_orders")
      .select(`
        id,
        order_number,
        total_amount,
        status,
        created_at,
        shop_order_items (
          id,
          price,
          product_id,
          products (
            id,
            name,
            price
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false
      });


    if (shopError) {
      throw shopError;
    }


    // =========================
    // ОБЪЕДИНЯЕМ ВСЕ ЗАКАЗЫ
    // =========================

    const allOrders = [];


    // Заявки на уникальный ник

    (nicknameOrders || []).forEach(order => {

      allOrders.push({
        type: "nickname",
        created_at: order.created_at,
        data: order
      });

    });


    // Заказы магазина

    (shopOrders || []).forEach(order => {

      allOrders.push({
        type: "shop",
        created_at: order.created_at,
        data: order
      });

    });


    // Самые новые сверху

    allOrders.sort((a, b) => {

      return (
        new Date(b.created_at) -
        new Date(a.created_at)
      );

    });


    loading.hidden = true;


    // =========================
    // ЗАКАЗОВ НЕТ
    // =========================

    if (allOrders.length === 0) {

      empty.hidden = false;
      list.hidden = true;

      return;
    }


    // =========================
    // ПОКАЗЫВАЕМ СПИСОК
    // =========================

    empty.hidden = true;
    list.hidden = false;
    list.innerHTML = "";


    allOrders.forEach(entry => {

      if (entry.type === "nickname") {

        renderNicknameOrder(
          entry.data
        );

      }


      if (entry.type === "shop") {

        renderShopOrder(
          entry.data
        );

      }

    });


  } catch (error) {

    console.error(
      "Ошибка загрузки заказов:",
      error
    );

    loading.hidden = false;

    loading.innerHTML = `
      <span>
        НЕ УДАЛОСЬ ЗАГРУЗИТЬ ЗАКАЗЫ
      </span>
    `;

  }



  // =========================
  // ЗАЯВКА НА УНИКАЛЬНЫЙ НИК
  // =========================

  function renderNicknameOrder(order) {

    const card =
      document.createElement("article");

    card.className = "order-card";


    const status =
      getNicknameStatus(order.status);


    const orderNumber =
      String(order.id).padStart(
        3,
        "0"
      );


    card.innerHTML = `

      <div class="order-card-top">

        <span class="order-type">
          ВОЗМОЖНОСТЬ
        </span>

        <span class="order-number">
          #${escapeHTML(orderNumber)}
        </span>

      </div>


      <h2>
        УНИКАЛЬНЫЙ НИК
      </h2>


      <p class="order-nickname">
        ${escapeHTML(order.nickname)}
      </p>


      <div class="order-price">
        ${formatPrice(order.price)}
      </div>


      <div class="order-status">

        <span class="order-status-label">
          СТАТУС
        </span>

        <div class="order-status-value">
          ${status.text}
        </div>

      </div>


      ${createNicknameAction(order.status)}

    `;


    list.appendChild(card);

  }



  // =========================
  // ЗАКАЗ МАСКИ
  // =========================

  function renderShopOrder(order) {

    const card =
      document.createElement("article");

    card.className = "order-card";


    const items =
      order.shop_order_items || [];


    const productNames =
      items
        .map(item => {

          if (item.products?.name) {
            return item.products.name;
          }

          return "МАСКА";

        })
        .join(" · ");


    const status =
      getShopStatus(order.status);


    card.innerHTML = `

      <div class="order-card-top">

        <span class="order-type">
          МАСКА
        </span>

        <span class="order-number">
          ${escapeHTML(order.order_number)}
        </span>

      </div>


      <h2>
        ${escapeHTML(productNames)}
      </h2>


      <div class="order-price">
        ${formatPrice(order.total_amount)}
      </div>


      <div class="order-status">

        <span class="order-status-label">
          СТАТУС
        </span>

        <div class="order-status-value">
          ${status.text}
        </div>

      </div>


      ${createShopAction(order.status)}

    `;


    list.appendChild(card);

  }



  // =========================
  // СТАТУСЫ НИКОВ
  // =========================

  function getNicknameStatus(status) {

    switch (status) {

      case "pending":
        return {
          text: "НА РАССМОТРЕНИИ"
        };


      case "approved":
        return {
          text: "ПОДТВЕРЖДЕНО · ОЖИДАЕТ ОПЛАТЫ"
        };


      case "paid":
        return {
          text: "ОПЛАЧЕНО ✓"
        };


      case "completed":
        return {
          text: "НИК ЗАКРЕПЛЁН ✓"
        };


      case "rejected":
        return {
          text: "ЗАЯВКА ОТКЛОНЕНА"
        };


      default:
        return {
          text: "ОБРАБАТЫВАЕТСЯ"
        };

    }

  }



  // =========================
  // СТАТУСЫ МАСОК
  // =========================

  function getShopStatus(status) {

    switch (status) {

      case "pending":
        return {
          text: "ОЖИДАЕТ ПОДТВЕРЖДЕНИЯ"
        };


      case "approved":
        return {
          text: "ЗАКАЗ ПОДТВЕРЖДЁН"
        };


      case "paid":
        return {
          text: "ОПЛАЧЕНО ✓"
        };


      case "completed":
        return {
          text: "ЗАКАЗ ВЫПОЛНЕН ✓"
        };


      case "cancelled":
        return {
          text: "ЗАКАЗ ОТМЕНЁН"
        };


      default:
        return {
          text: "ОБРАБАТЫВАЕТСЯ"
        };

    }

  }



  // =========================
  // ДЕЙСТВИЕ ДЛЯ НИКА
  // =========================

  function createNicknameAction(status) {

    if (status === "approved") {

      return `
        <button
          class="order-action"
          type="button"
          data-payment-action
        >

          <span>
            ОПЛАТИТЬ 2 000 ₽
          </span>

          <span>
            →
          </span>

        </button>
      `;

    }


    if (status === "pending") {

      return `
        <div
          class="order-action
                 order-action-disabled"
        >

          <span>
            ОЖИДАЕТ ПОДТВЕРЖДЕНИЯ
          </span>

          <span>
            ·
          </span>

        </div>
      `;

    }


    if (status === "paid") {

      return `
        <div
          class="order-action
                 order-action-disabled"
        >

          <span>
            ОПЛАТА ПОЛУЧЕНА
          </span>

          <span>
            ✓
          </span>

        </div>
      `;

    }


    if (status === "completed") {

      return `
        <div
          class="order-action
                 order-action-disabled"
        >

          <span>
            ЗАКАЗ ВЫПОЛНЕН
          </span>

          <span>
            ✓
          </span>

        </div>
      `;

    }


    return "";

  }



  // =========================
  // ДЕЙСТВИЕ ДЛЯ МАСКИ
  // =========================

  function createShopAction(status) {

    if (
      status === "pending" ||
      status === "approved"
    ) {

      return `
        <a
          class="order-action"
          href="https://t.me/stonedks"
          target="_blank"
          rel="noopener noreferrer"
        >

          <span>
            СВЯЗАТЬСЯ С МЕНЕДЖЕРОМ
          </span>

          <span>
            →
          </span>

        </a>
      `;

    }


    if (status === "paid") {

      return `
        <div
          class="order-action
                 order-action-disabled"
        >

          <span>
            ОПЛАТА ПОЛУЧЕНА
          </span>

          <span>
            ✓
          </span>

        </div>
      `;

    }


    if (status === "completed") {

      return `
        <div
          class="order-action
                 order-action-disabled"
        >

          <span>
            ЗАКАЗ ВЫПОЛНЕН
          </span>

          <span>
            ✓
          </span>

        </div>
      `;

    }


    return "";

  }



  // =========================
  // ФОРМАТ ЦЕНЫ
  // =========================

  function formatPrice(price) {

    const number =
      Number(price);


    if (!Number.isFinite(number)) {
      return "";
    }


    return new Intl.NumberFormat(
      "ru-RU"
    ).format(number) + " ₽";

  }



  // =========================
  // ЗАЩИТА HTML
  // =========================

  function escapeHTML(value) {

    const div =
      document.createElement("div");


    div.textContent =
      value == null
        ? ""
        : String(value);


    return div.innerHTML;

  }

});