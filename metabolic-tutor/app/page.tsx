'use client';
import React, { useState } from 'react';

export default function MetabolicNexusApp() {
  // 1. 로그인 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('student'); 
  const [userInfo, setUserInfo] = useState({ name: '', email: '', consent: false });

  // 2. 시뮬레이터 및 튜터 채팅 상태 관리
  const [currentTab, setCurrentTab] = useState('산화적 인산화');
  const [glucoseCount, setGlucoseCount] = useState(1);
  const [messageInput, setMessageInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'tutor', content: '환영합니다! 포도당 1분자를 넣으셨군요. 전자는 어디로 이동할까요?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // 로그인 핸들러
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo.consent) {
      alert("연구 참여 및 데이터 수집에 동의해주세요!");
      return;
    }
    if (userInfo.email === 'teacher@biologue.com') setUserRole('teacher');
    else setUserRole('student');
    setIsLoggedIn(true);
  };

  // 메시지 전송 핸들러
  const sendMessage = async () => {
    if (!messageInput.trim()) return;

    const newHistory = [...chatHistory, { role: 'student', content: messageInput }];
    setChatHistory(newHistory);
    setMessageInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentMessage: messageInput,
          currentTab: currentTab,
          glucoseCount: glucoseCount,
          studentInfo: userInfo
        }),
      });

      const aiData = await res.json();
      setChatHistory([...newHistory, { role: 'tutor', content: aiData.tutor_reply }]);
    } catch (error) {
      console.error('채팅 전송 실패:', error);
      alert('튜터와 연결이 끊어졌습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <header className="flex justify-between items-center p-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-blue-600">세포 대사 일렉트론 넥서스</h1>
        <div className="space-x-4">
          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">에듀테크 허브 가기</button>
          <button className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200">BioLogist 블로그 가기</button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        {/* 로그인 화면 */}
        {!isLoggedIn && (
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center">연구 참여 및 로그인</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="text" placeholder="이름" required className="w-full border p-2 rounded" onChange={e => setUserInfo({...userInfo, name: e.target.value})} />
              <input type="email" placeholder="이메일" required className="w-full border p-2 rounded" onChange={e => setUserInfo({...userInfo, email: e.target.value})} />
              <label className="flex items-center space-x-2 text-sm text-gray-700">
                <input type="checkbox" required onChange={e => setUserInfo({...userInfo, consent: e.target.checked})} />
                <span>연구 데이터 수집을 위한 정보 입력 및 활용에 동의합니다.</span>
              </label>
              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">학습 시작하기</button>
            </form>
          </div>
        )}

        {/* 교사 대시보드 */}
        {isLoggedIn && userRole === 'teacher' && (
          <div className="w-full h-full bg-white p-6 shadow-md rounded">
            <h2 className="text-2xl font-bold mb-4">👩‍🏫 교사 전용 분석 대시보드</h2>
            <p>이곳에 Firestore에서 불러온 학생들의 오개념 통계와 대화 로그표가 렌더링됩니다.</p>
          </div>
        )}

        {/* 학생 시뮬레이터 및 튜터 화면 */}
        {isLoggedIn && userRole === 'student' && (
          <div className="w-full h-full flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            
            {/* 시뮬레이터 영역 */}
            <div className="w-full md:w-2/3 bg-white shadow-md rounded p-4 flex flex-col">
              <h3 className="font-bold mb-2">🔬 인터랙티브 세포 대사 시뮬레이터</h3>
              <div className="flex space-x-2 mb-4">
                {['세포호흡', '광합성', '산화적 인산화', '광인산화'].map(tab => (
                  <button key={tab} onClick={() => setCurrentTab(tab)} className={`px-3 py-1 rounded ${currentTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {tab}
                  </button>
                ))}
              </div>
              <div className="mb-4">
                <label className="font-bold text-sm block mb-1">포도당 분자 수: {glucoseCount}개</label>
                <input type="range" min="1" max="5" value={glucoseCount} onChange={e => setGlucoseCount(Number(e.target.value))} className="w-full" />
              </div>
              <div className="flex-grow bg-black rounded flex items-center justify-center text-white min-h-[300px]">
                <p className="text-gray-400">[{currentTab}] 전자의 흐름 애니메이션 작동 중...</p>
              </div>
            </div>
            
            {/* AI 튜터 채팅 영역 */}
            <div className="w-full md:w-1/3 bg-white shadow-md rounded p-4 flex flex-col">
              <h3 className="font-bold mb-2">🤖 Gemini 인지 튜터</h3>
              <div className="flex-grow border rounded p-4 overflow-y-auto mb-2 bg-gray-50 flex flex-col space-y-3 min-h-[300px]">
                {chatHistory.map((chat, index) => (
                  <div key={index} className={`flex ${chat.role === 'student' ? 'justify-end' : 'justify-start'}`}>
                    <span className={`p-2 rounded-lg max-w-[80%] text-sm ${chat.role === 'student' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                      {chat.content}
                    </span>
                  </div>
                ))}
                {isLoading && <div className="text-gray-400 text-sm">튜터가 인지 분석 중...</div>}
              </div>
              <div className="flex space-x-2">
                <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="답변을 입력하세요..." className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <button onClick={sendMessage} disabled={isLoading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">전송</button>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* 하단 푸터 */}
      <footer className="bg-gray-800 text-white text-center p-4 mt-auto">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} BioLogist. All rights reserved. <br/>
          본 시뮬레이터 및 AI 인지 튜터 시스템은 생명과학 교육 연구 목적으로 제작되었습니다.
        </p>
      </footer>
    </div>
  );
}
