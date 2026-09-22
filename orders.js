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
        window.location.href = "auth.html";
        return;
      }
  
  
      // =========================
      // ПОЛУЧАЕМ ЗАКАЗЫ
      // =========================
  
      const { data: orders, error } = await supabaseClient
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
  
  
      if (error) {
        throw error;
      }
  
  
      loading.hidden = true;
  
  
      // =========================
      // ЗАКАЗОВ НЕТ
      // =========================
  
      if (!orders || orders.length === 0) {
  
        empty.hidden = false;
        return;
  
      }
  
  
      // =========================
      // ПОКАЗЫВАЕМ ЗАКАЗЫ
      // =========================
  
      list.hidden = false;
  
  
      orders.forEach(order => {
  
        const card = document.createElement("article");
  
        card.className = "order-card";
  
  
        const status = getStatus(order.status);
  
        const orderNumber =
          String(order.id).padStart(3, "0");
  
  
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
  
  
          ${createAction(order.status)}
  
        `;
  
  
        list.appendChild(card);
  
      });
  
  
    } catch (error) {
  
      console.error(
        "Ошибка загрузки заказов:",
        error
      );
  
      loading.innerHTML = `
        <span>
          НЕ УДАЛОСЬ ЗАГРУЗИТЬ ЗАКАЗЫ
        </span>
      `;
  
    }
  
  
  
    // =========================
    // СТАТУСЫ
    // =========================
  
    function getStatus(status) {
  
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
    // КНОПКА В ЗАВИСИМОСТИ
    // ОТ СТАТУСА
    // =========================
  
    function createAction(status) {
  
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
          <div class="order-action order-action-disabled">
  
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
          <div class="order-action order-action-disabled">
  
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
          <div class="order-action order-action-disabled">
  
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
  
      const number = Number(price);
  
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
        value == null ? "" : String(value);
  
      return div.innerHTML;
  
    }
  
  });