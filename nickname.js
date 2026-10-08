document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("nicknameSubmit");
  if (button) {
    button.disabled = true;
    button.textContent = "ЗАЯВКИ ВРЕМЕННО НЕДОСТУПНЫ";
  }
});
