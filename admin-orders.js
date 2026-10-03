document.addEventListener("DOMContentLoaded", async () => {

    const loading =
      document.getElementById("adminOrdersLoading");
  
    const list =
      document.getElementById("adminOrdersList");
  
    const empty =
      document.getElementById("adminOrdersEmpty");
  
  
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
  
        window.location.href =
          "account.html";
  
        return;
      }
  
  
      // =========================
      // ПОЛУЧАЕМ ЗАКАЗЫ
      // =========================
  
      const {
        data: orders,
        error: ordersError
      } = await supabaseClient
        .from("shop_orders")
        .select(`
          id,
          order_number,
          user_id,
          total_amount,
          status,
          created_at
        `)
        .order("created_at", {
          ascending: false
        });
  
  
      if (ordersError) {
        throw ordersError;
      }
  
  
      // =========================
      // НЕТ ЗАКАЗОВ
      // =========================
  
      loading.hidden = true;
  
  
      if (!orders || orders.length === 0) {
  
        empty.hidden = false;
  
        return;
      }
  
  
      // =========================
      // СОБИРАЕМ ДАННЫЕ
      // =========================
  
      const preparedOrders = [];
  
  
      for (const order of orders) {
  
        // ТОВАРЫ ЗАКАЗА
  
        const {
          data: orderItems,
          error: itemsError
        } = await supabaseClient
          .from("shop_order_items")
          .select(`
            product_id,
            price
          `)
          .eq("order_id", order.id);
  
  
        if (itemsError) {
          throw itemsError;
        }
  
  
        // ПРОФИЛЬ ПОКУПАТЕЛЯ
  
        const {
          data: profile,
          error: profileError
        } = await supabaseClient
          .from("profiles")
          .select(`
            name,
            phone,
            email,
            telegram_username
          `)
          .eq("user_id", order.user_id)
          .maybeSingle();
  
  
        if (profileError) {
          throw profileError;
        }
  
  
        // НАЗВАНИЯ ТОВАРОВ
  
        const products = [];
  
  
        for (const item of orderItems || []) {
  
          const {
            data: product,
            error: productError
          } = await supabaseClient
            .from("products")
            .select(`
              id,
              name
            `)
            .eq("id", item.product_id)
            .maybeSingle();
  
  
          if (productError) {
            throw productError;
          }
  
  
          products.push({
  
            name:
              product?.name ||
              "ТОВАР",
  
            price:
              item.price
  
          });
  
        }
  
  
        preparedOrders.push({
  
          ...order,
  
          profile:
            profile || {},
  
          products
  
        });
  
      }
  
  
      // =========================
      // ПОКАЗЫВАЕМ
      // =========================
  
      list.hidden = false;
  
      renderOrders(preparedOrders);
  
  
      // =========================
      // ФИЛЬТРЫ
      // =========================
  
      const tabs =
        document.querySelectorAll(
          ".admin-tab"
        );
  
  
      tabs.forEach(tab => {
  
        tab.addEventListener(
          "click",
          () => {
  
            tabs.forEach(item =>
              item.classList.remove("active")
            );
  
  
            tab.classList.add("active");
  
  
            const filter =
              tab.dataset.filter;
  
  
            if (filter === "all") {
  
              renderOrders(
                preparedOrders
              );
  
              return;
            }
  
  
            const filtered =
              preparedOrders.filter(
                order =>
                  order.status === filter
              );
  
  
            renderOrders(filtered);
  
          }
        );
  
      });
  
  
    } catch (error) {
  
      console.error(
        "Ошибка загрузки админ-заказов:",
        error
      );
  
  
      loading.innerHTML =
        "НЕ УДАЛОСЬ ЗАГРУЗИТЬ ЗАКАЗЫ";
  
    }
  
  
    // =========================
    // РЕНДЕР
    // =========================
  
    function renderOrders(orders) {
  
      list.innerHTML = "";
  
  
      if (orders.length === 0) {
  
        list.innerHTML = `
          <div class="admin-empty">
            ЗАКАЗОВ НЕТ
          </div>
        `;
  
        return;
      }
  
  
      orders.forEach(order => {
  
        const card =
          document.createElement("article");
  
  
        card.className =
          "admin-order-card";
  
  
        const profile =
          order.profile || {};
  
  
        const productsHTML =
          order.products.length
  
            ? order.products
                .map(product => `
                  <div class="admin-product">
  
                    <div class="admin-product-label">
                      МАСКА
                    </div>
  
                    <h2 class="admin-product-name">
                      ${escapeHTML(product.name)}
                    </h2>
  
                    <div class="admin-order-price">
                      ${formatPrice(product.price)}
                    </div>
  
                  </div>
                `)
                .join("")
  
            : `
                <div class="admin-product">
                  ТОВАР НЕ НАЙДЕН
                </div>
              `;
  
  
        const phoneHTML =
          profile.phone
  
            ? `
                <a href="tel:${escapeHTML(profile.phone)}">
                  ${escapeHTML(profile.phone)}
                </a>
              `
  
            : "";
  
  
        const telegramUsername =
          profile.telegram_username
            ? String(
                profile.telegram_username
              ).replace(/^@/, "")
            : "";
  
  
        const telegramHTML =
          telegramUsername
  
            ? `
                <a
                  href="https://t.me/${encodeURIComponent(telegramUsername)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @${escapeHTML(telegramUsername)}
                </a>
              `
  
            : "";
  
  
        const emailHTML =
          profile.email
  
            ? `
                <a href="mailto:${escapeHTML(profile.email)}">
                  ${escapeHTML(profile.email)}
                </a>
              `
  
            : "";
  
  
        card.innerHTML = `
  
          <div class="admin-order-top">
  
            <div class="admin-order-number">
              ${escapeHTML(order.order_number)}
            </div>
  
            <div class="admin-order-date">
              ${formatDate(order.created_at)}
            </div>
  
          </div>
  
  
          ${productsHTML}
  
  
          <div class="admin-customer">
  
            <div class="admin-customer-label">
              КЛИЕНТ
            </div>
  
            <div class="admin-customer-name">
              ${escapeHTML(
                profile.name ||
                "ИМЯ НЕ УКАЗАНО"
              )}
            </div>
  
            ${phoneHTML}
  
            ${telegramHTML}
  
            ${emailHTML}
  
          </div>
  
  
          <div class="admin-status">
  
            <span class="admin-status-label">
              СТАТУС
            </span>
  
            <select
              class="admin-status-select"
              data-order-id="${order.id}"
            >
  
              <option
                value="pending"
                ${order.status === "pending"
                  ? "selected"
                  : ""}
              >
                НОВЫЙ
              </option>
  
              <option
                value="paid"
                ${order.status === "paid"
                  ? "selected"
                  : ""}
              >
                ОПЛАЧЕН
              </option>
  
              <option
                value="cancelled"
                ${order.status === "cancelled"
                  ? "selected"
                  : ""}
              >
                ОТМЕНЁН
              </option>
  
              <option
                value="expired"
                ${order.status === "expired"
                  ? "selected"
                  : ""}
              >
                ЗАВЕРШЁН
              </option>
  
            </select>
  
          </div>
  
        `;
  
  
        list.appendChild(card);


        const statusSelect =
          card.querySelector(".admin-status-select");


        statusSelect.addEventListener(
          "change",
          async () => {

            const newStatus =
              statusSelect.value;

            const oldStatus =
              order.status;

            statusSelect.disabled = true;


            try {

              const { error } =
                await supabaseClient
                  .from("shop_orders")
                  .update({
                    status: newStatus
                  })
                  .eq("id", order.id);


              if (error) {
                throw error;
              }


              order.status = newStatus;


            } catch (error) {

              console.error(
                "Не удалось изменить статус:",
                error
              );

              statusSelect.value =
                oldStatus;

              alert(
                "Не удалось изменить статус заказа."
              );

            } finally {

              statusSelect.disabled = false;

            }

          }
        );


      });

    }
  
  
    // =========================
    // ЦЕНА
    // =========================
  
    function formatPrice(price) {
  
      return new Intl.NumberFormat(
        "ru-RU"
      ).format(Number(price)) + " ₽";
  
    }
  
  
    // =========================
    // ДАТА
    // =========================
  
    function formatDate(value) {
  
      if (!value) {
        return "";
      }
  
  
      const date =
        new Date(value);
  
  
      return date.toLocaleString(
        "ru-RU",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }
      );
  
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

  // =========================
// УПРАВЛЕНИЕ ТЕКУЩЕЙ ИГРОЙ
// =========================

async function loadAdminGame() {

  const titleInput =
    document.getElementById("adminGameTitle");

  const dateInput =
    document.getElementById("adminGameDate");

  const timeInput =
    document.getElementById("adminGameTime");

  const priceInput =
    document.getElementById("adminGamePrice");

  const message =
    document.getElementById("adminGameMessage");


  // Если блока управления игрой нет
  if (
    !titleInput ||
    !dateInput ||
    !timeInput ||
    !priceInput
  ) {
    return;
  }


  const {
    data: game,
    error
  } = await supabaseClient
    .from("games")
    .select(
      "id, title, game_date, game_time, price"
    )
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();


  if (error) {

    console.error(
      "Ошибка загрузки игры:",
      error
    );

    if (message) {
      message.textContent =
        "НЕ УДАЛОСЬ ЗАГРУЗИТЬ ИГРУ";
    }

    return;
  }


  if (!game) {

    if (message) {
      message.textContent =
        "АКТИВНАЯ ИГРА НЕ НАЙДЕНА";
    }

    return;
  }


  titleInput.value =
    game.title || "";

  dateInput.value =
    game.game_date || "";

  timeInput.value =
    game.game_time
      ? game.game_time.slice(0, 5)
      : "";

  priceInput.value =
    game.price ?? "";


  console.log(
    "Игра загружена в админку:",
    game
  );
}


// Загружаем игру при открытии админки
loadAdminGame();