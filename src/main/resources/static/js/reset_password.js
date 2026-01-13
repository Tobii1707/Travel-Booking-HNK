document.addEventListener("DOMContentLoaded", () => {
  const loadingState = document.getElementById("loading-state");
  const invalidToken = document.getElementById("invalid-token");
  const resetForm = document.getElementById("reset-password-form");
  const successMessage = document.getElementById("success-message");
  const modal = document.getElementById("error-modal");
  const closeModalBtn = document.getElementById("close-modal-button");
  const errorMsgEl = document.getElementById("error-message");

  if (!loadingState || !invalidToken || !resetForm || !successMessage || !modal || !closeModalBtn || !errorMsgEl) {
    return;
  }

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  function showInvalidToken() {
    loadingState.classList.add("hidden");
    invalidToken.classList.remove("hidden");
  }

  function showResetForm() {
    loadingState.classList.add("hidden");
    resetForm.classList.remove("hidden");
  }

  function openErrorModal(message) {
    errorMsgEl.textContent = message || "An error occurred.";
    // Keep current behavior: use display flex for modal
    modal.classList.remove("hidden");
    modal.style.display = "flex";
  }

  function closeErrorModal() {
    modal.style.display = "none";
  }

  // Validate token on page load
  async function validateToken() {
    if (!token) {
      showInvalidToken();
      return;
    }

    try {
      const response = await fetch(`/user/validate-reset-token?token=${encodeURIComponent(token)}`);
      const result = await response.json();

      if (result.code === 1000 && result.data === true) {
        showResetForm();
      } else {
        showInvalidToken();
      }
    } catch (error) {
      showInvalidToken();
    }
  }

  // Handle form submission
  resetForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const newPassword = document.getElementById("new-password")?.value || "";
    const confirmPassword = document.getElementById("confirm-password")?.value || "";

    if (newPassword !== confirmPassword) {
      openErrorModal("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      openErrorModal("Password must be at least 6 characters.");
      return;
    }

    try {
      const response = await fetch("/user/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }),
      });

      const result = await response.json();

      if (result.code === 1000) {
        resetForm.classList.add("hidden");
        successMessage.classList.remove("hidden");
      } else {
        openErrorModal(result.message);
      }
    } catch (error) {
      openErrorModal("An error occurred. Please try again.");
    }
  });

  closeModalBtn.addEventListener("click", closeErrorModal);

  window.addEventListener("click", function (event) {
    if (event.target === modal) closeErrorModal();
  });

  // Start validation on page load
  validateToken();
});
