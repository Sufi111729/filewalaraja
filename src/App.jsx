import TopNav from "./components/TopNav";
import ToolsGridSection from "./components/ToolsGridSection";
import AppHeroStrip from "./components/AppHeroStrip";
import AppFooter from "./components/AppFooter";
export default function App() {
  return (
    <>
      <TopNav />
      <main className="app-main">
        <AppHeroStrip mode="home" />
        <ToolsGridSection />
      </main>
      <AppFooter />
    </>
  );
}

