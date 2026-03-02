import TopNav from "./components/TopNav";
import AppFooter from "./components/AppFooter";

export default function AdminLoginApp() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <section className="mb-5 border-b border-slate-200 bg-white px-4 py-8 md:px-6 md:py-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-4xl">Authentication Disabled</h1>
            <p className="mt-3 text-base text-slate-600 md:text-lg">Har koi bina login ke CRUD panel access kar sakta hai.</p>
          </div>
        </section>

        <section className="mx-auto max-w-md panel">
          <p className="text-sm text-slate-700">Authentication system hata diya gaya hai.</p>
          <a href="/users" className="btn-primary mt-3 inline-flex">Open Users Panel</a>
        </section>
      </main>
      <AppFooter />
    </>
  );
}
