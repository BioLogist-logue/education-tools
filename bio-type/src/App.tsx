import { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { Share2, RotateCcw, ChevronRight, Activity, Zap, Sparkles, AlertCircle, Home, BookOpen, Download } from 'lucide-react';

const getEnv = (key: string): string => {
  const viteValue = import.meta.env[key];
  if (typeof viteValue === 'string') return viteValue;

  const maybeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return maybeProcess?.env?.[key] ?? '';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('REACT_APP_SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const isSupabaseReady = Boolean(SUPABASE_URL && SUPABASE_KEY);
declare global {
  interface Window {
    html2canvas?: typeof html2canvas;
  }
}

type Step = 'intro' | 'test' | 'loading' | 'result';
type Axis = 1 | 2 | 3 | 4;
type ScoreKey = '광' | '호' | '감' | '운' | '교' | '부' | '우' | '열';
type Theme = 'light' | 'dark';

type QuestionOption = {
  text: string;
  type: ScoreKey;
  score: number;
};

type Question = {
  id: number;
  axis: Axis;
  text: string;
  options: QuestionOption[];
};

type ScoreMap = Record<ScoreKey, number>;

type ResultData = {
  name: string;
  desc: string;
  soulmate: string;
  nemesis: string;
  color: string;
  rarity: string;
  theme: Theme;
};

type SupabaseStatRow = {
  type_id: string;
  count: number;
  updated_at?: string;
};

const initialScores: ScoreMap = { 광: 0, 호: 0, 감: 0, 운: 0, 교: 0, 부: 0, 우: 0, 열: 0 };

// --- [데이터베이스 영역] ---

// 1. 문항 은행 (총 50문항 - 각 축별로 랜덤하게 뽑아 쓰기 위해 축을 명시)
const questionBank: Question[] = [
  // 🌿 1축: 에너지 대사 [광(비축) vs 호(소비)] - 12문항
  { id: 1, axis: 1, text: "지옥 같던 기말고사가 끝났다! 오늘 하루 나는?", options: [{ text: "침대와 한 몸이 되어 광합성(수면) 돌입", type: "광", score: 2 }, { text: "집에서 맛있는 배달 음식 시켜 먹기", type: "광", score: 1 }, { text: "코인노래방 가서 성대 결절 올 때까지 열창", type: "호", score: 2 }] },
  { id: 2, axis: 1, text: "두둑한 용돈(포도당)이 들어왔다! 내 지갑의 운명은?", options: [{ text: "통장에 그대로 박제. 내 통장 잔고는 소중하니까", type: "광", score: 2 }, { text: "절반은 저축하고 절반만 쓴다", type: "광", score: 1 }, { text: "장바구니에 담아둔 거 즉시 결제! 탕진잼!", type: "호", score: 2 }] },
  { id: 3, axis: 1, text: "체육대회 날, 나의 포지션은?", options: [{ text: "나무 그늘 아래서 평화롭게 구경", type: "광", score: 2 }, { text: "돗자리에 앉아 수다 떨며 과자 먹기", type: "광", score: 1 }, { text: "계주 선수로 출전해 트랙을 찢음", type: "호", score: 2 }, { text: "목 터져라 소리 지르는 응원단장", type: "호", score: 3 }] },
  { id: 4, axis: 1, text: "뷔페에 갔을 때 나의 식사 전략은?", options: [{ text: "샐러드부터 천천히, 위장 공간을 체계적으로 계산", type: "광", score: 2 }, { text: "눈앞에 보이는 고기 위주로 무지성 돌격", type: "호", score: 2 }] },
  { id: 5, axis: 1, text: "스마트폰 배터리가 15% 남았다!", options: [{ text: "즉시 초절전 모드 켜고 화면 밝기 0%", type: "광", score: 2 }, { text: "꺼질 때까지 유튜브 쇼츠 넘겨봄", type: "호", score: 2 }] },
  { id: 6, axis: 1, text: "꿈같은 여름방학! 나의 1주 주기는?", options: [{ text: "집 밖은 위험해. 주 0~1회 외출", type: "광", score: 2 }, { text: "하루 나가면 하루는 집에서 쉬어야 함", type: "광", score: 1 }, { text: "매일매일 약속 풀방! 밖에서 살기", type: "호", score: 2 }] },
  { id: 7, axis: 1, text: "극심한 스트레스를 받을 때 푸는 방법은?", options: [{ text: "이불 덮고 12시간 꿀잠 자기", type: "광", score: 2 }, { text: "불닭볶음면 먹으면서 땀 빼기", type: "호", score: 1 }, { text: "미친 듯이 뛰거나 농구/축구 등 빡센 운동", type: "호", score: 2 }] },
  { id: 8, axis: 1, text: "게임을 할 때 나의 플레이 스타일은?", options: [{ text: "묵묵히 농사짓고 낚시하며 자원 채집", type: "광", score: 2 }, { text: "뒤에서 아군 힐 챙겨주는 서포터", type: "광", score: 1 }, { text: "적진으로 뛰어드는 무지성 돌격 딜러", type: "호", score: 2 }] },
  { id: 9, axis: 1, text: "여행 갈 때 선호하는 숙소는?", options: [{ text: "부대시설 빵빵한 호캉스", type: "광", score: 2 }, { text: "잠만 자면 됨! 가성비 게스트하우스", type: "호", score: 2 }] },
  { id: 10, axis: 1, text: "조별과제 중 10분 쉬는 시간!", options: [{ text: "책상에 엎드려 딥슬립", type: "광", score: 2 }, { text: "조원들과 쉴 새 없이 스몰토크", type: "호", score: 2 }] },
  { id: 11, axis: 1, text: "내가 가장 좋아하는 날씨는?", options: [{ text: "비 오는 날 전기장판 위에서 귤 까먹기", type: "광", score: 2 }, { text: "선선한 바람 맞으며 산책하기", type: "호", score: 1 }, { text: "햇빛 쨍쨍한 날 서핑이나 야외 액티비티", type: "호", score: 2 }] },
  { id: 12, axis: 1, text: "카페에 가면 내가 찾는 자리는?", options: [{ text: "구석탱이 가장 푹신하고 조용한 소파 자리", type: "광", score: 2 }, { text: "콘센트 꽂고 작업하기 좋은 테이블", type: "광", score: 1 }, { text: "사람들 구경하기 좋은 뻥 뚫린 창가 자리", type: "호", score: 2 }] },

  // 🧠 2축: 신경계 [감(수용/관찰) vs 운(행동/실행)] - 13문항
  { id: 13, axis: 2, text: "낯선 동네에서 길을 완전히 잃었다!", options: [{ text: "지도 앱 켜서 현 위치와 방향부터 꼼꼼히 분석", type: "감", score: 2 }, { text: "지나가는 사람들의 동선을 관찰", type: "감", score: 1 }, { text: "\"어떻게든 되겠지!\" 일단 직진", type: "운", score: 2 }] },
  { id: 14, axis: 2, text: "인터넷 쇼핑 중 맘에 드는 신발을 발견했다!", options: [{ text: "1점짜리 리뷰부터 별점 5점까지 100개 정독", type: "감", score: 2 }, { text: "장바구니에 넣고 3일 동안 고민함", type: "감", score: 1 }, { text: "\"내 사이즈 있네?\" 바로 삼성페이 결제", type: "운", score: 2 }] },
  { id: 15, axis: 2, text: "절친이 갑자기 펑펑 울고 있다!", options: [{ text: "왜 우는지 상황부터 스캔하고 원인 파악", type: "감", score: 2 }, { text: "눈물 닦을 휴지 탐색", type: "감", score: 1 }, { text: "\"누구야 델고와!!\" 일단 같이 화내며 소매 걷음", type: "운", score: 2 }] },
  { id: 16, axis: 2, text: "복잡한 조립식 책상을 샀다.", options: [{ text: "설명서를 3회독 하고 부품 개수부터 확인함", type: "감", score: 2 }, { text: "설명서는 버리고 일단 나사부터 조이기 시작함", type: "운", score: 2 }] },
  { id: 17, axis: 2, text: "식당 메뉴를 고를 때 나는?", options: [{ text: "'베스트 메뉴' 마크와 블로그 후기를 교차 검증", type: "감", score: 2 }, { text: "다른 테이블 사람들이 뭐 먹는지 스캔", type: "감", score: 1 }, { text: "오늘 내 위장이 부르는 느낌적인 느낌으로 직진", type: "운", score: 2 }] },
  { id: 18, axis: 2, text: "친구들과 새로운 보드게임을 할 때?", options: [{ text: "룰북을 완전히 이해하기 전엔 시작 불가", type: "감", score: 2 }, { text: "남들 하는 거 한 판 구경하면서 감 잡기", type: "감", score: 1 }, { text: "\"하면서 배우는 거지!\" 일단 주사위부터 던짐", type: "운", score: 2 }] },
  { id: 19, axis: 2, text: "발표 순서를 정해야 한다. 나의 선택은?", options: [{ text: "다른 애들 하는 거 관찰하려고 3번째나 마지막", type: "감", score: 2 }, { text: "매도 먼저 맞는 게 낫다! 시원하게 1빠", type: "운", score: 2 }] },
  { id: 20, axis: 2, text: "길을 걷다 요란하게 자빠졌다!", options: [{ text: "'누가 봤나?' 주변 사람 눈알 굴리며 스캔", type: "감", score: 2 }, { text: "벌떡 일어나서 빛의 속도로 현장 이탈", type: "운", score: 2 }] },
  { id: 21, axis: 2, text: "친구와 의견 충돌로 다투게 생겼다.", options: [{ text: "쟤가 왜 저러는지 머릿속으로 원인 분석", type: "감", score: 2 }, { text: "내 감정과 팩트를 정리", type: "감", score: 1 }, { text: "팩트고 나발이고 내 말부터 와다다다 뱉음", type: "운", score: 2 }] },
  { id: 22, axis: 2, text: "라면을 끓일 때 나의 스타일은?", options: [{ text: "종이컵으로 물 550ml 칼계량 필수", type: "감", score: 2 }, { text: "냄비 선에 대충 맞춤", type: "감", score: 1 }, { text: "한국인의 영혼을 담은 눈대중", type: "운", score: 2 }] },
  { id: 23, axis: 2, text: "넷플릭스 영화 고를 때?", options: [{ text: "예고편, 줄거리, 네이버 평점 다 확인", type: "감", score: 2 }, { text: "썸네일 탐색만 30분 하다가 결국 끔", type: "감", score: 1 }, { text: "그냥 인기순위 1위 바로 재생", type: "운", score: 2 }] },
  { id: 24, axis: 2, text: "노래방에서 나는 주로?", options: [{ text: "남들 부르는 거 들으며 다음 곡 탐색", type: "감", score: 2 }, { text: "무조건 일어나서 탬버린 흔들고 방방 뜀", type: "운", score: 2 }] },
  { id: 25, axis: 2, text: "새 학기 첫날 교실에 들어갔다!", options: [{ text: "누가 나랑 잘 맞을지, 빌런은 없는지 레이더 가동", type: "감", score: 2 }, { text: "자리 앉자마자 옆 애한테 지우개 빌리며 말 걺", type: "운", score: 2 }] },

  // 🚨 3축: 자율신경계 [교(긴장/흥분) vs 부(안정/이완)] - 12문항
  { id: 26, axis: 3, text: "내일은 수학 기말고사 첫날! 지금 내 상태는?", options: [{ text: "심장 쿵쾅거리고 불안해서 뜬눈으로 밤샘", type: "교", score: 2 }, { text: "스트레스 받아서 소화불량 옴", type: "교", score: 1 }, { text: "모르는 건 모르는 거다. 소화 잘 시키고 꿀잠", type: "부", score: 2 }] },
  { id: 27, axis: 3, text: "친구와 약속 시간에 10분 지각 확정이다!", options: [{ text: "식은땀 줄줄 흘리며 미친 듯이 전력 질주", type: "교", score: 2 }, { text: "\"어차피 늦은 거 안전하게 가자~\" 경보 모드", type: "부", score: 2 }] },
  { id: 28, axis: 3, text: "마피아 게임에서 내가 '마피아'에 걸렸다!", options: [{ text: "얼굴 시뻘개지고 동공 지진 5.0 발생", type: "교", score: 2 }, { text: "목소리 미세하게 떨려서 바로 들킴", type: "교", score: 1 }, { text: "심박수 60 유지, 완벽한 포커페이스", type: "부", score: 2 }] },
  { id: 29, axis: 3, text: "롤러코스터가 꼭대기에서 떨어지기 직전!", options: [{ text: "안전바 박살 낼 듯 꽉 쥐고 비명 장전", type: "교", score: 2 }, { text: "'풍경 좋네~' 평온하게 두 손 놓고 탐", type: "부", score: 2 }] },
  { id: 30, axis: 3, text: "조별 발표자가 당일 아침에 잠수를 탔다!", options: [{ text: "멘탈 바사삭, 손발이 달달 떨림", type: "교", score: 2 }, { text: "심호흡 10번 하고 어떻게든 해결책 모색", type: "부", score: 1 }, { text: "\"까짓거 대본 보고 내가 읽지 뭐\" 극강의 평온", type: "부", score: 2 }] },
  { id: 31, axis: 3, text: "치킨을 시켰는데 1시간 반째 안 온다!", options: [{ text: "가게에 3번 전화하고 리뷰 창 테러 고민", type: "교", score: 2 }, { text: "배달 앱 새로고침 무한 연타", type: "교", score: 1 }, { text: "닭을 잡으러 가셨나 보지~ 유튜브 시청", type: "부", score: 2 }] },
  { id: 32, axis: 3, text: "공포영화 깜툭튀(점프스케어) 장면에서?", options: [{ text: "팝콘 엎고 육두문자와 함께 소리 지름", type: "교", score: 2 }, { text: "옆 사람 팔뚝 멍들게 꼬집음", type: "교", score: 1 }, { text: "\"음, 분장이 훌륭하군.\" 미동도 없음", type: "부", score: 2 }] },
  { id: 33, axis: 3, text: "길 가다 꼴도 보기 싫은 전 애인을 마주쳤다!", options: [{ text: "아드레날린 폭발! 빛의 속도로 골목으로 도망", type: "교", score: 2 }, { text: "핸드폰 보는 척 고장 난 로봇처럼 걸음", type: "교", score: 1 }, { text: "그냥 아는 사람 1이네. 눈인사 쿨하게 박음", type: "부", score: 2 }] },
  { id: 34, axis: 3, text: "다이어트 중인데 눈앞에 페퍼로니 피자가 있다!", options: [{ text: "먹을까 말까 내적 갈등으로 식은땀 폭발", type: "교", score: 2 }, { text: "소화 효소 오픈! 맛있게 먹으면 0칼로리~ 이완 모드", type: "부", score: 2 }] },
  { id: 35, axis: 3, text: "버스에 탔는데 지갑과 폰을 다 두고 왔다!", options: [{ text: "등골 찌릿, 허둥지둥 \"기사님 문 열어주세요!!\"", type: "교", score: 2 }, { text: "\"기사님 죄송합니다...\" 싹싹 빌기", type: "교", score: 1 }, { text: "계좌번호 주시면 이체하겠습니다. 침착 대처", type: "부", score: 2 }] },
  { id: 36, axis: 3, text: "롤(LOL)이나 경쟁 게임에서 지고 있을 때?", options: [{ text: "승부욕에 불타 샷건 치고 팀원과 키보드 배틀", type: "교", score: 2 }, { text: "스트레스 이빠이 받고 게임 삭제 충동", type: "교", score: 1 }, { text: "\"게임은 게임일 뿐~\" 져도 웃는 즐겜러", type: "부", score: 2 }] },
  { id: 37, axis: 3, text: "화장실이 너무 급한데 칸이 꽉 찼다!", options: [{ text: "문고리 잡고 달달 떨며 식은땀 줄줄", type: "교", score: 2 }, { text: "괄약근의 평화 유지, 눈 감고 명상", type: "부", score: 2 }] },

  // 👑 4축: 유전 [우(표출/우성) vs 열(숨김/열성)] - 13문항
  { id: 38, axis: 4, text: "반 톡방(단톡방)에서 나의 지분율은?", options: [{ text: "내가 말 안 하면 단톡방이 안 굴러감. 대화 주도", type: "우", score: 2 }, { text: "분위기 타서 가끔 찰진 드립 침", type: "우", score: 1 }, { text: "주로 읽씹하거나 'ㅋㅋ' 기계 리액션만 함", type: "열", score: 2 }] },
  { id: 39, axis: 4, text: "조별과제 역할 분담 시간! 나의 포지션은?", options: [{ text: "\"제가 조장할게요!\" 또는 \"발표할게요!\"", type: "우", score: 2 }, { text: "\"음... 전 자료 조사나 PPT 깎을게요...\"", type: "열", score: 2 }] },
  { id: 40, axis: 4, text: "길에서 나와 똑같은 옷을 입은 사람을 발견했다!", options: [{ text: "\"오 찌찌뽕!\" 속으로 내 핏이 더 낫다며 우월감 느낌", type: "우", score: 2 }, { text: "조용히 골목으로 도망쳐서 겉옷을 벗어 던짐", type: "열", score: 2 }] },
  { id: 41, axis: 4, text: "단체 사진 찍을 때 나의 위치는?", options: [{ text: "센터에서 V 포즈하며 시선 강탈", type: "우", score: 2 }, { text: "앞줄 사이드에서 무난한 미소", type: "우", score: 1 }, { text: "뒷줄 구석에서 남의 머리에 가려 얼굴만 빼꼼", type: "열", score: 2 }] },
  { id: 42, axis: 4, text: "누군가 나를 폭풍 칭찬했을 때 반응은?", options: [{ text: "\"제가 좀 하죠 ㅋ\" 능글맞게 수용", type: "우", score: 2 }, { text: "\"아휴 아니에요, 운이 좋았어요...\" 동공 지진하며 부정", type: "열", score: 2 }] },
  { id: 43, axis: 4, text: "수련회 장기자랑 시간!", options: [{ text: "무대 장악력 200%, 마이크 독점", type: "우", score: 2 }, { text: "친구 춤출 때 뒤에서 백업 댄서", type: "우", score: 1 }, { text: "관객석 구석에서 영혼 없는 박수 부대", type: "열", score: 2 }] },
  { id: 44, axis: 4, text: "식당에서 김치가 부족할 때?", options: [{ text: "큰 소리로 \"이모님~ 여기 김치 좀 더 주세요!!\"", type: "우", score: 2 }, { text: "이모님과 눈 마주칠 때까지 10분간 텔레파시 보냄", type: "열", score: 2 }] },
  { id: 45, axis: 4, text: "엄청나게 맘에 드는 이성을 발견했다!", options: [{ text: "직진해서 \"번호 좀 주실래요?\"", type: "우", score: 2 }, { text: "주변을 맴돌며 눈도장만 찍음", type: "우", score: 1 }, { text: "말 한마디 못 걸어보고 3년 짝사랑 후 종료", type: "열", score: 2 }] },
  { id: 46, axis: 4, text: "내 의견과 다르게 상황이 흘러갈 때?", options: [{ text: "\"잠깐! 내 생각엔 말이야...\" 당당하게 어필", type: "우", score: 2 }, { text: "논리적으로 반박 자료 제시", type: "우", score: 1 }, { text: "속으로 궁시렁대지만 대세에 따름", type: "열", score: 2 }] },
  { id: 47, axis: 4, text: "엘리베이터에 모르는 사람과 단둘이 탔다!", options: [{ text: "\"몇 층 가세요? 눌러드릴게요~\" 인싸력 발동", type: "우", score: 2 }, { text: "거울 보며 내 앞머리만 다듬음", type: "우", score: 1 }, { text: "핸드폰만 뚫어져라 보며 숨 막히는 침묵", type: "열", score: 2 }] },
  { id: 48, axis: 4, text: "새 학기, 모르는 친구와 짝꿍이 됐다!", options: [{ text: "\"안녕? 넌 이름이 뭐야?!\" 선빵", type: "우", score: 2 }, { text: "상대가 먼저 말 걸어줄 때까지 침묵 수행", type: "열", score: 2 }] },
  { id: 49, axis: 4, text: "동아리나 반 회식이 끝난 후?", options: [{ text: "\"이대로 집 갈 거야?! 2차 가자!!\"", type: "우", score: 2 }, { text: "취한 애들 챙겨서 택시 태워 보냄", type: "우", score: 1 }, { text: "소리 소문 없이 이미 내 방 침대 누워있음", type: "열", score: 2 }] },
  { id: 50, axis: 4, text: "친구들이 평가하는 나의 첫인상은?", options: [{ text: "\"너 처음부터 개나대서(?) 인싸인 줄 알았어\"", type: "우", score: 2 }, { text: "\"처음엔 엄청 조용한 줄 알았는데 친해지니 진국이네\"", type: "열", score: 2 }] }
];

// 2. 16가지 결과 데이터베이스
const resultKeys = [
  '광감교우',
  '광운교우',
  '광감부우',
  '광운부우',
  '광감교열',
  '광운교열',
  '광감부열',
  '광운부열',
  '호감교우',
  '호운교우',
  '호감부우',
  '호운부우',
  '호감교열',
  '호운교열',
  '호감부열',
  '호운부열'
] as const;

type ResultKey = typeof resultKeys[number];

const isResultKey = (value: string): value is ResultKey => resultKeys.includes(value as ResultKey);

const resultsDB: Record<ResultKey, ResultData> = {
  "광감교우": { name: "파워 관종 해바라기", desc: "기공을 활짝 열고 증산 작용 풀가동! 빛 자극이 오면 감각 뉴런이 즉시 수용해 교감 신경을 자극합니다. 남들 눈에 무조건 띄어야 직성이 풀리는 순도 100% 뼈우성 형질이네요.", soulmate: "구석탱이 공변세포", nemesis: "야식 러버 올빼미", color: "bg-purple-300", rarity: "6.2", theme: "light" },
  "광운교우": { name: "불도저 파리지옥", desc: "곤충이 닿자마자 운동 뉴런 급발진! 교감 신경 텐션으로 항상 흥분 상태입니다. 가만히 서서 광합성만 하는 다른 식물들을 제일 답답해하는 행동파 우성!", soulmate: "야행성 버섯", nemesis: "방구석 겨울잠 곰", color: "bg-purple-400", rarity: "3.1", theme: "dark" },
  "광감부우": { name: "마이웨이 호박 넝쿨", desc: "햇빛 쬐며 부교감 신경의 은총으로 포도당을 꿀꺽꿀꺽 비축합니다. 세상 구경만 할 뿐 움직이지 않는 묵직한 덩치의 우성 인싸!", soulmate: "과호흡 미모사", nemesis: "급발진 햄스터", color: "bg-purple-200", rarity: "8.5", theme: "light" },
  "광운부우": { name: "대기만성 아름드리나무", desc: "평소엔 부교감 신경으로 평온하게 양분을 저장하다가, 필 받으면 거침없이 잎을 뻗습니다. 숲을 지배하는 든든한 표현형!", soulmate: "샤이 관종 칡넝쿨", nemesis: "유리 멘탈 개복치", color: "bg-purple-500", rarity: "7.4", theme: "dark" },
  "광감교열": { name: "과호흡 미모사", desc: "누가 살짝만 건드려도 감각 뉴런이 비명을 지르며 교감 신경이 요동쳐서 잎을 홱 접어버립니다. '날 가만 내버려 둬...'가 입버릇인 예민보스 열성 형질.", soulmate: "마이웨이 호박 넝쿨", nemesis: "동네 흔한 백수 카피바라", color: "bg-yellow-200", rarity: "12.3", theme: "light" },
  "광운교열": { name: "샤이 관종 칡넝쿨", desc: "평소엔 숨어있는 열성 순종이지만, 스트레스를 받으면 운동 뉴런을 발동시켜 남의 나무를 몰래 칭칭 감아버리는 맑은 눈의 광인!", soulmate: "대기만성 아름드리나무", nemesis: "프로 관전러 판다", color: "bg-yellow-300", rarity: "4.8", theme: "light" },
  "광감부열": { name: "구석탱이 공변세포", desc: "기공을 꽉 닫고 수분을 지키며 부교감 신경의 완벽한 안정을 느낍니다. 감각 뉴런으로 눈치만 살피며 절대 밖으로 나서지 않는 방구석 열성러.", soulmate: "파워 관종 해바라기", nemesis: "에너자이저 비글", color: "bg-yellow-100", rarity: "14.2", theme: "light" },
  "광운부열": { name: "야행성 버섯", desc: "남들이 안 볼 때 부교감 신경의 여유로움을 느끼며 꼬물꼬물 운동 뉴런을 씁니다. 숲의 그늘에서 조용히 포자를 날리며 덕질하는 열성 매니아.", soulmate: "불도저 파리지옥", nemesis: "동네 흔한 백수 카피바라", color: "bg-yellow-400", rarity: "2.5", theme: "light" },
  
  // ✨ 주황색 파스텔 톤 대거 투입!
  "호감교우": { name: "경계 모드 미어캣", desc: "바스락 소리에 감각 뉴런 쭈뼛! 교감 신경이 요동치며 에너지를 팍팍 낭비합니다. 무리에서 제일 튀고 싶어 하는 뼛속까지 리더 우성!", soulmate: "방구석 겨울잠 곰", nemesis: "야행성 버섯", color: "bg-orange-300", rarity: "9.1", theme: "light" },
  "호운교우": { name: "에너자이저 비글", desc: "세포 호흡 풀가동! 교감 신경 폭주와 운동 뉴런의 환상 콜라보. 하루 종일 지치지 않고 뛰어다녀서 주변까지 피곤하게 만드는 발현도 100%!", soulmate: "야식 러버 올빼미", nemesis: "구석탱이 공변세포", color: "bg-orange-400", rarity: "5.5", theme: "light" },
  "호감부우": { name: "프로 관전러 판다", desc: "대나무 먹고 부교감 신경 활성화! 남들 노는 거 구경만 하며 에너지를 아끼는 평화롭고 친근한 우성 존재감.", soulmate: "유리 멘탈 개복치", nemesis: "샤이 관종 칡넝쿨", color: "bg-orange-200", rarity: "6.8", theme: "light" },
  "호운부우": { name: "동네 흔한 백수 카피바라", desc: "소화계 든든히 채운 뒤, 기분 좋게 운동 뉴런을 깨워 친목 도모 산책을 나갑니다. 어떤 생물과도 잘 어울리는 친화력 갑 우성 형질!", soulmate: "급발진 햄스터", nemesis: "과호흡 미모사", color: "bg-orange-300", rarity: "11.1", theme: "light" },
  "호감교열": { name: "유리 멘탈 개복치", desc: "아주 작은 자극(감각 뉴런)에도 교감 신경이 터질 듯이 반응해 심방과 심실이 요동칩니다. 겉보기엔 멀쩡한 척 평온을 유지하려는 짠내 나는 열성!", soulmate: "프로 관전러 판다", nemesis: "대기만성 아름드리나무", color: "bg-orange-200", rarity: "3.9", theme: "light" },
  "호운교열": { name: "급발진 햄스터", desc: "낮에는 열성답게 구석에 숨어 지내다, 밤만 되면 교감 신경 텐션 업! 쳇바퀴에 운동 뉴런을 몰빵하는 조용한 사고뭉치.", soulmate: "동네 흔한 백수 카피바라", nemesis: "마이웨이 호박 넝쿨", color: "bg-orange-400", rarity: "2.1", theme: "light" },
  "호감부열": { name: "방구석 겨울잠 곰", desc: "세포 호흡 최소화! 부교감 신경 릴렉스를 유지하며 기나긴 동면 모드 돌입. 방바닥에 완벽히 동화된 열성 동형 접합자.", soulmate: "경계 모드 미어캣", nemesis: "불도저 파리지옥", color: "bg-yellow-200", rarity: "8.8", theme: "light" },
  "호운부열": { name: "야식 러버 올빼미", desc: "남들 다 잘 때 부교감 신경의 간절한 부름을 받고, 조용히 냉장고로 운동 뉴런을 뻗는 은밀한 열성 은신 만렙!", soulmate: "에너자이저 비글", nemesis: "파워 관종 해바라기", color: "bg-yellow-100", rarity: "3.7", theme: "light" }
};

const findTypeKeyByName = (typeName: string): ResultKey | null => {
  const match = resultKeys.find((key) => resultsDB[key].name === typeName);
  return match ?? null;
};

function TypeIcon({ typeName }: { typeName: string }) {
  const [hasError, setHasError] = useState(false);
  const typeKey = findTypeKeyByName(typeName);

  useEffect(() => {
    setHasError(false);
  }, [typeName]);

  if (!typeKey || hasError) {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-400 ring-1 ring-purple-200">
        <Sparkles size={13} strokeWidth={2.5} />
      </span>
    );
  }

  return (
    <img
      src={`/icons/${typeKey}.png`}
      alt=""
      className="h-6 w-6 shrink-0 rounded-full bg-purple-50 object-cover ring-1 ring-purple-100"
      onError={() => setHasError(true)}
    />
  );
}

// --- [앱 컴포넌트] ---
export default function App() {
  const [step, setStep] = useState<Step>('intro');
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<ScoreMap>(initialScores);
  const [finalType, setFinalType] = useState<ResultKey>('호감교열');
  const [showToast, setShowToast] = useState(false); // 토스트 알림 상태 추가
  const [toastMsg, setToastMsg] = useState(""); // 동적 토스트 메시지
  const [imgError, setImgError] = useState(false); // ✨ 이미지 로드 실패 상태

  const [realRarity, setRealRarity] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);    // DB 연동 총 참여자 수

  // ✨ MBTI 유형 풀이 함수 추가 (머글 번역기 가동!)
  const explainType = (typeStr: ResultKey) => {
    const dict: Record<ScoreKey, string> = { 광: '광합성', 호: '세포호흡', 감: '감각뉴런', 운: '운동뉴런', 교: '교감신경', 부: '부교감신경', 우: '우성', 열: '열성' };
    return (typeStr.split('') as ScoreKey[]).map((char) => dict[char]).join(' · ');
  };

  useEffect(() => {
    window.html2canvas = html2canvas;

    const params = new URLSearchParams(window.location.search);
    const sharedResult = params.get('result');

    if (sharedResult && isResultKey(sharedResult)) {
      setFinalType(sharedResult);
      setStep('result');
    }
  }, []);

  useEffect(() => {
    setImgError(false);
  }, [finalType]);

  // 클립보드 복사 및 토스트 알림 함수
  const copyToClipboard = () => {
    // ✨ 내 결과 유형을 URL 뒤에 꼬리표로 붙여서 복사합니다.
    const currentDomain = window.location.origin + window.location.pathname;
    // 결과 화면에서 공유하면 내 결과가 포함된 링크, 아니면 기본 링크
    const shareUrl = step === 'result' ? `${currentDomain}?result=${finalType}` : currentDomain;

    const dummy = document.createElement("input");
    document.body.appendChild(dummy);
    dummy.value = shareUrl;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    
    setToastMsg("✨ 링크가 성공적으로 복사되었습니다!");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // 3초 뒤 알림 숨김
  };

  const handleDownloadImage = async () => {
    const captureElement = document.getElementById('capture-area');

    if (!captureElement) {
      setToastMsg('캡처할 결과 영역을 찾지 못했습니다. 잠시 후 다시 시도해주세요.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      const canvas = await html2canvas(captureElement, {
        scale: 2,
        backgroundColor: '#f3f4f6',
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `bio-type-${finalType}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setToastMsg('📸 결과 이미지가 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('이미지 저장 중 오류가 발생했습니다.', error);
      setToastMsg('이미지 저장 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 앱 시작 시 문항 10개 랜덤 세팅 (로직: 1축 3문제, 2축 3문제, 3축 2문제, 4축 2문제 = 총 10문제)
  const initializeTest = () => {
    // ✨ 진짜 100% 랜덤! 피셔-예이츠 셔플 알고리즘 적용
    const shuffle = <T,>(array: T[]): T[] => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    };
    
    const axis1 = shuffle(questionBank.filter(q => q.axis === 1)).slice(0, 3);
    const axis2 = shuffle(questionBank.filter(q => q.axis === 2)).slice(0, 3);
    const axis3 = shuffle(questionBank.filter(q => q.axis === 3)).slice(0, 2);
    const axis4 = shuffle(questionBank.filter(q => q.axis === 4)).slice(0, 2);
    
    const final10 = shuffle([...axis1, ...axis2, ...axis3, ...axis4]);
    setTestQuestions(final10);
    setScores(initialScores);
    setCurrentIndex(0);
    setImgError(false); // ✨ 다시하기 누를 때 이미지 에러 상태도 초기화!
    setStep('test');
  };

  const handleAnswer = (type: ScoreKey, score: number) => {
    setScores(prev => ({ ...prev, [type]: prev[type] + score }));
    
    if (currentIndex < testQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      calculateResult();
    }
  };

  // ✨ Supabase에 결과 저장하고 실시간 통계 불러오는 함수
  const updateAndFetchStats = async (typeId: ResultKey) => {
    if (!isSupabaseReady) {
      console.warn('Supabase 환경변수가 없어 결과 통계를 저장하지 않았습니다.');
      return;
    }
    
    try {
      // 1. 내 결과 DB에 +1 카운트 추가 (미리 만들어둔 RPC 함수 호출)
      const incrementResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_mbti_count`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_type_id: typeId })
      });

      if (!incrementResponse.ok) {
        const message = await incrementResponse.text();
        throw new Error(`Supabase RPC 실패: ${incrementResponse.status} ${message}`);
      }

      // 2. 전체 통계 데이터 불러오기
      const res = await fetch(`${SUPABASE_URL}/rest/v1/mbti_stats?select=*`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(`Supabase 통계 조회 실패: ${res.status} ${message}`);
      }

      const data = (await res.json()) as SupabaseStatRow[];
      
      // 3. 리얼타임 희귀도 계산
      let total = 0;
      let myCount = 0;
      data.forEach(item => {
        total += item.count;
        if (item.type_id === typeId) myCount = item.count;
      });

      if (total > 0) {
        setTotalCount(total);
        const rarity = ((myCount / total) * 100).toFixed(1);
        setRealRarity(rarity);
      }
    } catch (error) {
      console.error("DB 연동 중 오류 발생! (기본 데이터로 대체합니다)", error);
    }
  };

  const calculateResult = () => {
    setStep('loading'); // 도파민 터지는 로딩 화면으로 전환
    
    setTimeout(() => {
      // 점수 비교 로직
      // 동점일 경우 기본값 설정 (띨빡이의 센스)
      const t1 = scores.광 >= scores.호 ? '광' : '호';
      const t2 = scores.감 >= scores.운 ? '감' : '운';
      const t3 = scores.교 >= scores.부 ? '교' : '부';
      const t4 = scores.우 >= scores.열 ? '우' : '열';
      
      const resultKey = `${t1}${t2}${t3}${t4}` as ResultKey;
      const finalRes: ResultKey = isResultKey(resultKey) ? resultKey : "호감교열";
      
      // 혹시라도 (동점 등) 없는 키가 나올 리 없지만 방어 코드
      setFinalType(finalRes); 
      
      // ✨ 결과 확정 직후 DB 통계 업데이트 발동!
      updateAndFetchStats(finalRes);
      
      setStep('result');
    }, 2000); // 2초간 쫄깃하게 대기
  };

  // --- [UI 렌더링 함수들] ---

  const renderIntro = () => (
    // ✨ 배경에 오렌지 파스텔 톤 믹스
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 via-orange-50 to-yellow-100 p-6 relative">
      {/* 상단 링크 버튼 */}
      <div className="absolute top-4 left-4 flex gap-2">
        <a href="https://biologue-tools.vercel.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-purple-400 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm hover:bg-purple-500 transition-all">
          <Home size={14} /> 에듀테크 허브
        </a>
        <a href="https://blog.naver.com/biologue_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-yellow-400 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm hover:bg-yellow-500 transition-all">
          <BookOpen size={14} /> 블로그
        </a>
      </div>

      {/* 오른쪽 상단 공유 버튼 */}
      <div className="absolute top-4 right-4">
        <button 
          onClick={copyToClipboard} 
          className="flex items-center gap-1 bg-white text-purple-600 border border-purple-200 text-xs font-bold px-3 py-2 rounded-xl shadow-sm hover:bg-purple-50 transition-all"
        >
          <Share2 size={14} /> 테스트 공유
        </button>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full animate-fade-in-up mt-14 mb-8">
        <div className="flex justify-center mb-4 text-purple-500">
          <Activity size={48} strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-2 tracking-tight text-center">
          생물학적 MBTI
        </h1>
        <h2 className="text-xl font-bold text-purple-600 mb-6 text-center">
          "나의 생태계 자아 찾기"
        </h2>
        
        {/* ✨ 설명 텍스트 디자인 개선 (왼쪽 정렬 및 박스 처리) */}
        <div className="text-gray-700 mb-8 text-[15px] leading-relaxed text-left bg-orange-50/70 p-5 rounded-2xl break-keep border border-orange-100">
          광합성부터 뉴런, 자율신경계까지! 일상 속 나의 반응을 통해 숨겨진 생물학적 본성을 재미있게 파헤쳐 봅니다.<br/><br/>
          <span className="font-bold text-orange-600 flex items-center gap-1.5">
            <Sparkles size={16} /> 과연 나의 소울메이트와 천적은 누구일까요?
          </span>
        </div>

        <button 
          onClick={initializeTest}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          테스트 시작하기 <ChevronRight size={20} />
        </button>
      </div>
      
      {/* ✨ 푸터 겹침 해결 (absolute 제거, flex 하단 배치) */}
      <div className="w-full text-center text-xs text-gray-400 mt-auto pb-4">
        © Copyright 2026 All rights reserved by BioLogist
      </div>
    </div>
  );

  const renderTest = () => {
    const currentQ = testQuestions[currentIndex];
    const progress = ((currentIndex) / testQuestions.length) * 100;

    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4 sm:p-6 relative">
        <div className="w-full max-w-md flex-grow">
          {/* 프로그레스 바 */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8 mt-4">
            <div className="bg-purple-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg mb-8 min-h-[200px] flex flex-col justify-center animate-fade-in">
            <div className="text-purple-500 font-bold mb-2 text-sm">
              Q{currentIndex + 1}.
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 leading-snug">
              {currentQ?.text}
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {currentQ?.options.map((opt, idx) => (
              <button
                key={`${currentQ.id}-${idx}`}
                onClick={(event) => {
                  event.currentTarget.blur();
                  handleAnswer(opt.type, opt.score);
                }}
                className="w-full bg-white border-2 border-gray-100 md:hover:bg-purple-50 md:hover:border-purple-300 text-gray-700 font-semibold py-4 px-6 rounded-2xl shadow-sm transition-all text-left active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>
        {/* ✨ 푸터 겹침 해결 */}
        <div className="w-full text-center text-xs text-gray-400 mt-auto pt-8 pb-4">
          © Copyright 2026 All rights reserved by BioLogist
        </div>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6 text-center relative">
      <Zap size={64} className="text-yellow-400 animate-pulse mb-6" />
      <h2 className="text-2xl font-bold mb-2 animate-bounce">유전자 분석 중...</h2>
      <p className="text-gray-400 mb-12">교감 신경과 부교감 신경의 줄다리기를 계산하고 있습니다.</p>
      
      {/* ✨ 푸터 겹침 해결 */}
      <div className="w-full text-center text-xs text-gray-500 mt-auto pb-4">
        © Copyright 2026 All rights reserved by BioLogist
      </div>
    </div>
  );

  const renderResult = () => {
    const resultData = resultsDB[finalType];
    const isLight = resultData.theme === 'light'; // ✨ 배경색에 따른 밝기 판별
    
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 sm:p-6 pt-20 relative">
        
        {/* 상단 링크 버튼 (결과창에도 다시 등장!) */}
        <div className="absolute top-4 left-4 flex gap-2 z-20">
          <a href="https://biologue-tools.vercel.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-purple-400 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm hover:bg-purple-500 transition-all">
            <Home size={14} /> 에듀테크 허브
          </a>
          <a href="https://blog.naver.com/biologue_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-yellow-400 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm hover:bg-yellow-500 transition-all">
            <BookOpen size={14} /> 블로그
          </a>
        </div>

        {/* ✨ 오른쪽 상단 공유 버튼 (결과창에도 등장!) */}
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={copyToClipboard} 
            className="flex items-center gap-1 bg-white text-purple-600 border border-purple-200 text-xs font-bold px-3 py-2 rounded-xl shadow-sm hover:bg-purple-50 transition-all"
          >
            <Share2 size={14} /> 테스트 공유
          </button>
        </div>

        <div className="w-full max-w-md animate-fade-in-up flex-grow">
          
          {/* ✨ 캡처를 위해 하나의 영역으로 묶음 */}
          <div id="capture-area" className="bg-gray-100 p-2 sm:p-4 rounded-3xl mb-4 -mx-2">
            {/* 메인 결과 카드 (명도에 따른 글씨색 동적 변경 적용) */}
            <div className={`p-8 rounded-3xl shadow-xl mb-6 relative overflow-hidden ${resultData.color} ${isLight ? 'text-gray-900' : 'text-white'}`}>
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Sparkles size={100} className={isLight ? 'text-gray-900' : 'text-white'} />
              </div>
              <div className="relative z-10 text-center">
              <span className={`${isLight ? 'bg-black/10 text-gray-800' : 'bg-white/20 text-white'} text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block`}>
                희귀도 상위 {realRarity !== null ? realRarity : resultData.rarity}%
              </span>
              <div className={`text-sm font-bold tracking-widest mb-1 ${isLight ? 'text-gray-700' : 'opacity-80'}`}>
                [{finalType}]
              </div>
              {/* ✨ 일반인을 위한 친절한 유형 풀이 추가 */}
              <div className={`text-xs font-medium mb-5 inline-block px-3 py-1 rounded-full ${isLight ? 'bg-black/10 text-gray-800' : 'bg-black/20 text-white opacity-90'}`}>
                {explainType(finalType)}
              </div>

              {/* ✨ 커스텀 캐릭터 이미지 영역 (동그란 액자 디자인) */}
              <div className="w-40 h-40 sm:w-48 sm:h-48 relative mx-auto mb-6 rounded-full p-2 bg-white/20 backdrop-blur-md shadow-inner">
                {!imgError ? (
                  <img 
                    src={`/images/${finalType}.png`} 
                    alt={resultData.name}
                    className="w-full h-full object-cover rounded-full shadow-lg bg-white"
                    onError={() => setImgError(true)} // 이미지를 못 찾으면(에러) 에러 상태를 true로 변경
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center rounded-full shadow-lg bg-white/40">
                    <Sparkles size={40} className={isLight ? 'text-gray-600' : 'text-white'} />
                    <span className={`text-xs mt-2 font-bold ${isLight ? 'text-gray-600' : 'text-white'}`}>이미지 준비중</span>
                  </div>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black mb-6 drop-shadow-md">
                {resultData.name}
              </h1>
              <p className={`text-sm sm:text-base leading-relaxed p-4 rounded-xl backdrop-blur-sm text-left ${isLight ? 'bg-white/50 text-gray-900 font-medium' : 'bg-black/10 opacity-95 text-white'}`}>
                  {resultData.desc}
                </p>
                {/* ✨ DB 연동 시 총 테스트 참여자 수 표시 */}
                {totalCount > 0 && (
                  <div className={`mt-4 text-xs font-bold ${isLight ? 'text-gray-500' : 'text-white/60'}`}>
                    📊 현재까지 총 {totalCount.toLocaleString()}명이 테스트에 참여했어요!
                  </div>
                )}
              </div>
            </div>

            {/* 소울메이트 & 천적 카드 */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="min-w-0 bg-white p-4 rounded-2xl shadow-md border-t-4 border-purple-400">
                <div className="text-xs text-gray-500 font-bold mb-2 text-center">💖 소울메이트</div>
                <div className="flex min-w-0 items-center justify-center gap-2 font-bold text-gray-800 text-sm sm:text-base break-keep leading-snug">
                  <TypeIcon typeName={resultData.soulmate} />
                  <span className="min-w-0">{resultData.soulmate}</span>
                </div>
              </div>
              <div className="min-w-0 bg-white p-4 rounded-2xl shadow-md border-t-4 border-yellow-400">
                <div className="text-xs text-gray-500 font-bold mb-2 text-center">⚡ 멸종 천적</div>
                <div className="flex min-w-0 items-center justify-center gap-2 font-bold text-gray-800 text-sm sm:text-base break-keep leading-snug">
                  <TypeIcon typeName={resultData.nemesis} />
                  <span className="min-w-0">{resultData.nemesis}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex flex-col gap-3 px-2">
            <button 
              onClick={handleDownloadImage}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Download size={20} /> 결과 이미지 저장하기
            </button>

            <button 
              onClick={copyToClipboard}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Share2 size={20} /> 결과 공유하기
            </button>

            <div className="rounded-2xl border border-orange-100 bg-orange-50/80 p-4 text-center shadow-sm">
              <p className="text-sm font-bold text-orange-700 break-keep leading-snug mb-3">
                다른 에듀테크를 더 보고 싶다면?
              </p>
              <a
                href="https://biologue-tools.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white hover:bg-orange-100 text-orange-700 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-orange-200"
              >
                <Home size={18} /> 에듀테크 허브로 이동
              </a>
            </div>
            
            <button 
              onClick={() => setStep('intro')}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-4 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 border border-gray-200"
            >
              <RotateCcw size={20} /> 테스트 다시하기
            </button>
          </div>
          
          <div className="mt-8 mb-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
            <AlertCircle size={12} /> 교육 목적으로 제작된 재미용 테스트입니다.
          </div>
        </div>
        
        {/* ✨ 푸터 겹침 해결 (flex 하단 배치) */}
        <div className="w-full text-center text-xs text-gray-400 mt-auto pt-6 pb-2">
          © Copyright 2026 All rights reserved by BioLogist
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans antialiased text-gray-900 selection:bg-purple-200 flex flex-col min-h-screen">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
      
      {step === 'intro' && renderIntro()}
      {step === 'test' && renderTest()}
      {step === 'loading' && renderLoading()}
      {step === 'result' && renderResult()}

      {/* 토스트 알림 UI */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 bg-gray-800 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 animate-fade-in-up flex items-center justify-center gap-2 font-bold text-sm text-center break-keep leading-snug">
          <Sparkles size={16} className="text-yellow-400 shrink-0" /> <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
