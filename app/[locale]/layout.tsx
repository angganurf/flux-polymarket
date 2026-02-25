import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/session-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AuthProvider>
          <QueryProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <ServiceWorkerRegister />
            <InstallPrompt />
          </QueryProvider>
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
