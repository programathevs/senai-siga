export type ToastType = "success" | "error" | "warning";

export function showAvatarToast(
  message: string,
  title: string = "Sucesso!",
  type: ToastType = "success"
) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("show-avatar-toast", {
        detail: { message, title, type },
      })
    );
  }
}
