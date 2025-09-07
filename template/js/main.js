import NotificationSystem from "./notifications.js";

// Demo bindings for buttons
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("button[data-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-type");
      NotificationSystem.show(`This is a ${type} notification.`, type);
    });
  });

  // A friendly welcome toast
  NotificationSystem.show(
    "Welcome! Theme switcher is in the top-right.",
    "success",
  );
});
