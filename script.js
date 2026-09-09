const burgerBtn = document.getElementById("burgerBtn");
const burgerMenu = document.getElementById("burgerMenu");
const burgerClose = document.getElementById("burgerClose");

burgerBtn.addEventListener("click", () => {
  burgerMenu.classList.add("active");
});

burgerClose.addEventListener("click", () => {
  burgerMenu.classList.remove("active");
});

const joinGameBtn = document.getElementById("joinGameBtn");

if (joinGameBtn) {
  joinGameBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    const {
      data: { session }
    } = await supabaseClient.auth.getSession();

    if (session?.user) {
      window.location.href = "booking.html";
    } else {
      window.location.href = "account.html?mode=register&redirect=booking.html";
    }
  });
}