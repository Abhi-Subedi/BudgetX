import { LogoMark, Wordmark } from "./Logo";

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper">
      <div className="flex items-center gap-3 opacity-80">
        <LogoMark />
        <Wordmark />
      </div>
    </div>
  );
}
