import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TactileFeedback from "./components/TactileFeedback";
import ToastContainer from "./components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Uzhavar Market - Fresh Farm Direct",
  description: "Fresh farm produce directly from farmers to customers",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  localStorage.removeItem('uzhavar_theme');
                  var mql = window.matchMedia('(prefers-color-scheme: dark)');
                  function updateTheme() {
                    if (mql.matches) {
                      document.documentElement.classList.add('dark');
                      document.documentElement.setAttribute('data-theme', 'dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                      document.documentElement.setAttribute('data-theme', 'light');
                    }
                  }
                  updateTheme();
                  if (mql.addEventListener) {
                    mql.addEventListener('change', updateTheme);
                  } else if (mql.addListener) {
                    mql.addListener(updateTheme);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <TactileFeedback />
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
