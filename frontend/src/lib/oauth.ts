const OAUTH_POPUP_WIDTH = 500;
const OAUTH_POPUP_HEIGHT = 600;

export interface OAuthResult {
  code: string;
  state: string | null;
}

export function openOAuthPopup(provider: "google" | "apple"): Promise<OAuthResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/oauth/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        reject(new Error(data.detail || "Failed to initiate OAuth"));
        return;
      }

      const { url } = await response.json();

      const left = window.screenX + (window.outerWidth - OAUTH_POPUP_WIDTH) / 2;
      const top = window.screenY + (window.outerHeight - OAUTH_POPUP_HEIGHT) / 2;

      const popup = window.open(
        url,
        `oauth_${provider}`,
        `width=${OAUTH_POPUP_WIDTH},height=${OAUTH_POPUP_HEIGHT},left=${left},top=${top},popup=yes`
      );

      if (!popup) {
        reject(new Error("Popup blocked. Please allow popups for this site."));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("OAuth timed out. Please try again."));
        popup.close();
      }, 120000);

      const handler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        const data = event.data;
        if (data && data.type === `oauth_${provider}_callback`) {
          clearTimeout(timeout);
          window.removeEventListener("message", handler);
          popup.close();

          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve({ code: data.code, state: data.state });
          }
        }
      };

      window.addEventListener("message", handler);

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          clearTimeout(timeout);
          window.removeEventListener("message", handler);
          reject(new Error("OAuth cancelled."));
        }
      }, 500);
    } catch (err) {
      reject(err);
    }
  });
}
