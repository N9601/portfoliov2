import { BoardLazy } from "@/components/board/BoardLazy";
import { Hero } from "@/components/chapters/Hero";
import { Toolbox } from "@/components/chapters/Toolbox";
import { Work } from "@/components/chapters/Work";
import { Person } from "@/components/chapters/Person";
import { Contact } from "@/components/chapters/Contact";

export default function Home() {
  return (
    <main id="spine" className="relative">
      <BoardLazy />
      <div className="relative z-10">
        <Hero />
        <Toolbox />
        <Work />
        <Person />
        <Contact />
      </div>
    </main>
  );
}
