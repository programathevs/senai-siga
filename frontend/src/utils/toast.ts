export function showAvatarToast(message: string, title: string = "Sucesso!") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("show-avatar-toast", {
        detail: { message, title },
      })
    );
  }
}
