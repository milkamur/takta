// Только публичная информация о ближайшей игре. Никаких операций записи.
(async function () {
  const ids = ["gameDate", "gameTime", "gameEndTime", "gameLocation", "gameLocationDetails", "gameFormat", "gamePrice"];
  try {
    const { data: game, error } = await supabaseClient.from("games")
      .select("game_date,game_time,end_time,location,location_details,format,price")
      .eq("is_active", true).limit(1).maybeSingle();
    if (error || !game) throw error || new Error("No active game");
    const date = String(game.game_date || "").split("-");
    const months = ["ЯНВАРЯ","ФЕВРАЛЯ","МАРТА","АПРЕЛЯ","МАЯ","ИЮНЯ","ИЮЛЯ","АВГУСТА","СЕНТЯБРЯ","ОКТЯБРЯ","НОЯБРЯ","ДЕКАБРЯ"];
    const values = {
      gameDate: date.length === 3 ? `${Number(date[2])} ${months[Number(date[1])-1] || ""}` : "—",
      gameTime: String(game.game_time || "—").slice(0,5),
      gameEndTime: String(game.end_time || "—").slice(0,5),
      gameLocation: game.location || "—",
      gameLocationDetails: game.location_details || "",
      gameFormat: game.format || "—",
      gamePrice: game.price != null ? `${Number(game.price).toLocaleString("ru-RU")} ₽` : "—"
    };
    for (const id of ids) { const el = document.getElementById(id); if (el) el.textContent = values[id]; }
  } catch (err) {
    console.warn("Не удалось загрузить информацию об игре", err);
    const el = document.getElementById("gameDate");
    if (el) el.textContent = "СКОРО";
  }
})();
