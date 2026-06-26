import React from 'react';

export const metadata = {
  title: '세포 대사 일렉트론 넥서스',
  description: 'AI 인지 튜터 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
