document.addEventListener("DOMContentLoaded", () => {

    const nicknameInput = document.getElementById("nicknameInput");
    const nicknameComment = document.getElementById("nicknameComment");
    const nicknameSubmit = document.getElementById("nicknameSubmit");
  
    if (!nicknameInput || !nicknameSubmit) {
      console.error("Не найдены элементы формы ника.");
      return;
    }
  
  
    nicknameSubmit.addEventListener("click", async () => {
  
      // Получаем ник
      const nickname = nicknameInput.value.trim();
  
      // Получаем комментарий
      const comment = nicknameComment
        ? nicknameComment.value.trim()
        : "";
  
  
      // Проверяем, заполнен ли ник
      if (!nickname) {
        alert("Укажите желаемый ник.");
        nicknameInput.focus();
        return;
      }
  
  
      // Блокируем кнопку, чтобы заявку случайно
      // не отправили несколько раз
      nicknameSubmit.disabled = true;
  
      const originalHTML = nicknameSubmit.innerHTML;
  
      nicknameSubmit.innerHTML = `
        <span>ОТПРАВЛЯЕМ...</span>
        <span>·</span>
      `;
  
  
      try {
  
        // Проверяем авторизацию
        const {
          data: { user },
          error: userError
        } = await supabaseClient.auth.getUser();
  
  
        if (userError) {
          throw userError;
        }
  
  
        // Если человек не вошёл в аккаунт
        if (!user) {
  
          alert(
            "Для оформления уникального ника необходимо войти в аккаунт."
          );
  
          window.location.href = "auth.html";
          return;
        }
  
  
        // Отправляем заявку в Supabase
        const { data, error } = await supabaseClient
          .from("nickname_orders")
          .insert({
            user_id: user.id,
            nickname: nickname,
            comment: comment || null
          })
          .select()
          .single();
  
  
        if (error) {
          throw error;
        }
  
  
        console.log("Заявка создана:", data);
  
  
        // Показываем успешное оформление
        showNicknameSuccess();
  
  
      } catch (error) {
  
        console.error(
          "Ошибка при отправке заявки:",
          error
        );
  
        alert(
            "Ошибка: " + (error.message || JSON.stringify(error))
          );
  
        nicknameSubmit.disabled = false;
        nicknameSubmit.innerHTML = originalHTML;
  
      }
  
    });
  
  
  
    // =========================
    // УСПЕШНАЯ ЗАЯВКА
    // =========================
  
    function showNicknameSuccess() {
  
      const orderSection =
        document.querySelector(".nickname-order");
  
      if (!orderSection) return;
  
  
      orderSection.innerHTML = `
  
        <div class="nickname-success">
  
          <div class="nickname-success-check">
            ✓
          </div>
  
          <span class="nickname-success-kicker">
            JAX · UNIQUE ID
          </span>
  
          <h2>
            ЗАЯВКА ПРИНЯТА
          </h2>
  
          <p class="nickname-success-text">
            Мы проверим выбранный ник.
            Оператор JAX свяжется с вами
            для подтверждения деталей.
          </p>
  
  
          <div class="nickname-success-status">
  
            <span>
              СТАТУС
            </span>
  
            <strong>
              НА РАССМОТРЕНИИ
            </strong>
  
          </div>
  
  
          <a
            href="account.html"
            class="nickname-success-link"
          >
            <span>
              ПЕРЕЙТИ В ЛИЧНЫЙ КАБИНЕТ
            </span>
  
            <span>
              →
            </span>
          </a>
  
        </div>
  
      `;
  
    }
  
  });