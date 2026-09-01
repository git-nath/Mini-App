export {};

declare global {
  interface TelegramWebAppUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  }

  interface TelegramWebApp {
    initData: string;
    initDataUnsafe: { user?: TelegramWebAppUser };
    colorScheme: "light" | "dark";
    themeParams: Record<string, string>;
    ready: () => void;
    expand: () => void;
    sendData: (data: string) => void;
    openTelegramLink?: (url: string) => void;
    openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
    showAlert: (message: string, callback?: () => void) => void;
    isVersionAtLeast?: (version: string) => boolean;
  }

  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}
