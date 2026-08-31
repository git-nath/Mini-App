export {};

declare global {
  interface TelegramWebAppUser {
    first_name: string;
    last_name?: string;
    username?: string;
  }

  interface TelegramWebApp {
    initData: string;
    initDataUnsafe: { user?: TelegramWebAppUser };
    colorScheme: "light" | "dark";
    themeParams: Record<string, string>;
    ready: () => void;
    expand: () => void;
    sendData: (data: string) => void;
    showAlert: (message: string, callback?: () => void) => void;
    isVersionAtLeast?: (version: string) => boolean;
  }

  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}
