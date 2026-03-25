document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-text]");
  if (!button) return;

  const original = button.textContent;
  const encoded = button.getAttribute("data-copy-text") || "";
  const text = decodeURIComponent(encoded);

  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = original;
    }, 1400);
  } catch (error) {
    button.textContent = "Copy Failed";
    window.setTimeout(() => {
      button.textContent = original;
    }, 1600);
  }
});
