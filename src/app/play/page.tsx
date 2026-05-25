import type { Metadata } from "next";
import GameApp from "@/components/game/GameApp";

export const metadata: Metadata = {
  title: "Play",
  description:
    "Football Club Architectをブラウザでプレイできます。クラブ名と社長名を設定し、localStorageに保存しながらローカルMVPを進められます。",
};

export default function PlayPage() {
  return <GameApp />;
}
