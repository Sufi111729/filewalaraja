import TopNav from "./components/TopNav";
import AppFooter from "./components/AppFooter";

export default function AuthApp() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <section className="mb-5 border-b border-slate-200 bg-white px-4 py-8 md:px-6 md:py-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-4xl">Authentication Removed</h1>
            <p className="mt-3 text-base text-slate-600 md:text-lg">
              Har koi bina login ke app use kar sakta hai.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-xl panel text-center">
          <p className="text-sm text-slate-700">Access fully open hai. Seedha users panel ya tools open karein.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <a href="/users" className="btn-primary">Open Users Panel</a>
            <a href="/" className="btn-muted">Go to Home</a>
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  );
}
