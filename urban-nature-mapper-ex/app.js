// 🚪 [웹앱 보안 문지기] 학생들만 아는 비밀번호가 틀리면 화면을 아예 파괴합니다.
const accessPassword = prompt("🔒 우리 과학 수업 전용 비밀번호 4자리를 입력하세요:");
if (accessPassword !== "7890") { // 👈 주인님이 원하시는 4자리 암호 설정
    await bioAlert("❌ 권한이 없습니다. 외부인은 접속할 수 없습니다.");
    document.body.innerHTML = "<div style='text-align:center; margin-top:20%; font-size:24px; font-weight:bold; color:red;'>🔒 인가되지 않은 사용자입니다. 접근이 차단되었습니다.</div>";
    throw new Error("Access Denied"); // 스크립트 강제 중단
}
