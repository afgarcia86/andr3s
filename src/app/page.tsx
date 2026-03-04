import { Header } from "@/components/Header";
import { ChatPanel } from "@/components/ChatPanel";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatPanel />
      </main>
    </>
  );
}
