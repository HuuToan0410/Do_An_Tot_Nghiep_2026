import type { ReactNode } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CompareBar from "../components/CompareBar";
interface Props {
  children: ReactNode;
}

export default function MainLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 pb-16">{children}</main>
      <Footer />
      <CompareBar />
    </div>
  );
}
