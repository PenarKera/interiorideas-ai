import { AuthProvider } from "../lib/AuthContext";
import "./globals.css";

export const metadata = {
  title: "InteriorIdeas.ai",
  description: "AI Interior Design Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}