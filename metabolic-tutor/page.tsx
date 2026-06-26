import React, { useState, useEffect } from 'react';
// Supabase, Firestore, Gemini 모듈은 별도 파일로 모듈화하여 불러옵니다.
// import { supabase } from '@/lib/supabase';
// import { db } from '@/lib/firestore';

export default function MetabolicNexusApp() {
  // 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('student'); // 'teacher' or 'student'
  const [userInfo, setUserInfo] = useState({ name: '', email: '', consent: false });

  // 로그인 핸들러
  const handleLogin = (e) => {
    e.preventDefault();
    if (!userInfo.consent) {
      alert("연구 참여 및 데이터 수집에 동의해주세요!");
      return;
    }
    // TODO: Supabase Auth 연동 로직
    // 예: 인증 성공 시 role 확인 후 상태 업데이트
    // 임시 로직
    if (userInfo.email === 'teacher@biologue.com') setUserRole('teacher');
    else setUserRole('student');
    
    setIsLoggedIn(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* 🌟 1. 상단 커스텀 헤더 */}
      <header className="flex justify-between items-center p-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-blue-600">세포 대사 일렉트론 넥서스</h1>
        <div className="space-x-4">
          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
            에듀테크 허브 가기
          </button>
          <button className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200">
            BioLogist 블로그 가기
          </button>
        </div>
      </header>

      {/* 🌟 2. 메인 콘텐츠 영역 (조건부 렌더링) */}
      <main className="flex-grow flex items-center justify-center p-4">
        
        {/* A. 로그인 전 화면 (이름, 이메일, 동의 폼) */}
        {!isLoggedIn && (
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center">연구 참여 및 로그인</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="text" placeholder="이름" required
                className="w-full border p-2 rounded"
                onChange={e => setUserInfo({...userInfo, name: e.target.value})}
              />
              <input 
                type="email" placeholder="이메일" required
                className="w-full border p-2 rounded"
                onChange={e => setUserInfo({...userInfo, email: e.target.value})}
              />
              <label className="flex items-center space-x-2 text-sm text-gray-700">
                <input 
                  type="checkbox" 
                  onChange={e => setUserInfo({...userInfo, consent: e.target.checked})}
                />
                <span>연구 데이터 수집을 위한 정보 입력 및 활용에 동의합니다.</span>
              </label>
              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                학습 시작하기
              </button>
            </form>
          </div>
        )}

        {/* B. 로그인 후 화면 (교사 vs 학생) */}
        {isLoggedIn && userRole === 'teacher' && (
          <div className="w-full h-full bg-white p-6 shadow-md rounded">
            <h2 className="text-2xl font-bold mb-4">👩‍🏫 교사 전용 분석 대시보드</h2>
            <p>이곳에 Firestore에서 불러온 학생들의 오개념 통계와 대화 로그표가 렌더링됩니다.</p>
            {/* TODO: Firestore 데이터 테이블 컴포넌트 삽입 */}
          </div>
        )}

        {isLoggedIn && userRole === 'student' && (
          <div className="w-full h-full flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            {/* 시뮬레이터 영역 */}
            <div className="w-full md:w-2/3 bg-white shadow-md rounded p-4 flex flex-col">
              <h3 className="font-bold mb-2">🔬 인터랙티브 세포 대사 시뮬레이터</h3>
              <div className="flex-grow bg-black rounded flex items-center justify-center text-white">
                {/* TODO: 애니메이션 컴포넌트 (Framer Motion 등 활용) */}
                <p>전자의 흐름, 포도당 수량 조절 애니메이션 영역</p>
              </div>
            </div>
            
            {/* AI 튜터 채팅 영역 */}
            <div className="w-full md:w-1/3 bg-white shadow-md rounded p-4 flex flex-col">
              <h3 className="font-bold mb-2">🤖 Gemini 인지 튜터</h3>
              <div className="flex-grow border rounded p-2 overflow-y-auto mb-2 bg-gray-50">
                {/* TODO: 채팅 로그 매핑 */}
                <p className="text-sm bg-blue-100 p-2 rounded w-3/4 mb-2">포도당 1분자를 넣으셨군요! 세포호흡 과정에서 전자는 어디로 이동할까요?</p>
              </div>
              <input type="text" placeholder="답변을 입력하세요..." className="border p-2 rounded w-full" />
            </div>
          </div>
        )}

      </main>

      {/* 🌟 3. 하단 카피라이트 푸터 */}
      <footer className="bg-gray-800 text-white text-center p-4 mt-auto">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} BioLogist. All rights reserved. <br/>
          본 시뮬레이터 및 AI 인지 튜터 시스템은 생명과학 교육 연구 목적으로 제작되었습니다.
        </p>
      </footer>
    </div>
  );
}
