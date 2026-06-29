import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 튜터와 함께하는 산화적 인산화 시뮬레이터",
  description: "고등학교 생명과학 산화적 인산화 학습용 인터랙티브 시뮬레이터"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
