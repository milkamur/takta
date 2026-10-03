// =========================
// ЗАЩИТА МАГАЗИНА JAX
// =========================

async function protectShopPage() {
    try {
      const {
        data: { session },
        error
      } = await supabaseClient.auth.getSession();
  
      if (error) {
        console.error(
          "Ошибка проверки авторизации:",
          error
        );
  
        window.location.href =
          "account.html?mode=register&redirect=" +
          encodeURIComponent(
            window.location.pathname.split("/").pop() || "shop.html"
          );
  
        return;
      }
  
      // Пользователь НЕ авторизован
      if (!session?.user) {
  
        const currentPage =
          window.location.pathname
            .split("/")
            .pop() || "shop.html";
  
        window.location.href =
          "account.html?mode=register&redirect=" +
          encodeURIComponent(currentPage);
  
        return;
      }
  
      // Пользователь авторизован
      console.log(
        "JAX SHOP: пользователь авторизован",
        session.user.id
      );
  
      document.documentElement.classList.add(
        "shop-auth-ready"
      );
  
    } catch (error) {
  
      console.error(
        "Ошибка защиты магазина:",
        error
      );
  
      window.location.href =
        "account.html?mode=register&redirect=shop.html";
    }
  }
  
  protectShopPage();