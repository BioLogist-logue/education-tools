"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { BarChart3, Download, MessageSquareText, TriangleAlert, Users } from "lucide-react";
import { ChemicalText } from "@/components/ChemicalText";
import { fetchTeacherDashboard } from "@/lib/supabase/queries";

type DashboardData = Awaited<ReturnType<typeof fetchTeacherDashboard>>;
type RecordRow = Record<string, unknown>;

export function TeacherDemoDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  const students = useMemo(() => asRows(data?.students), [data]);
  const sessions = useMemo(() => asRows(data?.sessions), [data]);
  const simulationLogs = useMemo(() => asRows(data?.simulationLogs), [data]);
  const chatLogs = useMemo(() => asRows(data?.chatLogs), [data]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((student) => getId(student) === selectedStudentId) ?? null;
  }, [selectedStudentId, students]);

  const selectedSessionIds = useMemo(() => {
    if (!selectedStudentId) return new Set<string>();
    return new Set(
      sessions
        .filter((session) => String(session["student_id"] ?? "") === selectedStudentId)
        .map((session) => getId(session))
        .filter(Boolean)
    );
  }, [selectedStudentId, sessions]);

  const visibleSessions = useMemo(() => {
    if (!selectedStudentId) return sessions;
    return sessions.filter((session) => String(session["student_id"] ?? "") === selectedStudentId);
  }, [selectedStudentId, sessions]);

  const visibleSimulationLogs = useMemo(() => {
    if (!selectedStudentId) return simulationLogs;
    return simulationLogs.filter((log) => belongsToStudent(log, selectedStudentId, selectedSessionIds));
  }, [selectedStudentId, selectedSessionIds, simulationLogs]);

  const visibleChatLogs = useMemo(() => {
    if (!selectedStudentId) return chatLogs;
    return chatLogs.filter((log) => belongsToStudent(log, selectedStudentId, selectedSessionIds));
  }, [chatLogs, selectedStudentId, selectedSessionIds]);

  const tagCounts = useMemo(() => countTags(visibleChatLogs), [visibleChatLogs]);

  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">교사용 데이터를 불러오는 중입니다...</div>;
  }

  function clearSelection() {
    setSelectedStudentId(null);
  }

  function downloadExcel() {
    const workbook = buildExcelWorkbook(students, sessions, simulationLogs, chatLogs, countTags(chatLogs));
    const blob = new Blob(["\ufeff" + workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "산화적 인산화 교사용 대시보드.xls";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber/30 bg-amber/10 p-4 text-sm leading-6 text-slate-700">
        <p>이 화면은 교사용 확인 화면입니다. 학생 이름을 누르면 아래 최근 학습 흔적 영역에서 해당 학생의 기록만 모아 볼 수 있습니다.</p>
        <button type="button" onClick={downloadExcel} className="inline-flex items-center gap-2 rounded-md bg-marine px-3 py-2 font-semibold text-white transition hover:bg-marine/90">
          <Download size={16} /> 결과 엑셀 시트 다운로드
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Users} label="학생" value={String(students.length)} />
        <Metric icon={BarChart3} label="학습 세션" value={String(sessions.length)} />
        <Metric icon={TriangleAlert} label="시뮬레이션 기록" value={String(simulationLogs.length)} />
        <Metric icon={MessageSquareText} label="AI 튜터 대화" value={String(chatLogs.length)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">학생 목록</h2>
            {selectedStudent ? (
              <button type="button" onClick={clearSelection} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                전체 보기
              </button>
            ) : null}
          </div>
          <div className="space-y-2">
            {students.slice(0, 24).map((student) => {
              const id = getId(student);
              const active = id === selectedStudentId;
              return (
                <button
                  key={id || studentLabel(student)}
                  type="button"
                  onClick={() => setSelectedStudentId(id)}
                  className={"flex w-full items-center justify-between rounded-md px-4 py-3 text-left text-sm transition " + (active ? "bg-marine text-white shadow-soft" : "bg-panel text-slate-700 hover:bg-mint/20")}
                >
                  <span className="font-semibold">{studentLabel(student)}</span>
                  <span className={active ? "text-white/80" : "text-slate-500"}>{studentDate(student)}</span>
                </button>
              );
            })}
            {students.length === 0 ? <Empty text="아직 학생 데이터가 없습니다." /> : null}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-bold text-ink">{selectedStudent ? "선택 학생 오개념 태그" : "주요 오개념 태그"}</h2>
          <div className="space-y-3">
            {tagCounts.map(([tag, count]) => (
              <div key={tag}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700"><ChemicalText text={tag} /></span>
                  <span>{count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-coral" style={{ width: String(Math.min(100, count * 16)) + "%" }} />
                </div>
              </div>
            ))}
            {tagCounts.length === 0 ? <Empty text="아직 오개념 태그가 없습니다." /> : null}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">{selectedStudent ? studentLabel(selectedStudent) + " 학습 상황" : "최근 학습 흔적"}</h2>
          {selectedStudent ? <span className="rounded-full bg-mint/20 px-3 py-1 text-sm font-semibold text-marine">학생별 기록 보기</span> : null}
        </div>

        {selectedStudent ? (
          <StudentSummary
            sessions={visibleSessions}
            simulationLogs={visibleSimulationLogs}
            chatLogs={visibleChatLogs}
          />
        ) : null}

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {visibleSimulationLogs.slice(0, 8).map((log, index) => (
            <SimulationLogCard key={getId(log) || String(index)} log={log} />
          ))}
          {visibleSimulationLogs.length === 0 ? <Empty text={selectedStudent ? "이 학생의 시뮬레이션 기록이 아직 없습니다." : "시뮬레이션 기록이 없습니다."} /> : null}
        </div>

        {selectedStudent ? (
          <div className="mt-5 border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-base font-bold text-ink">최근 AI 튜터 대화</h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {visibleChatLogs.slice(0, 6).map((log, index) => (
                <ChatLogCard key={getId(log) || String(index)} log={log} />
              ))}
              {visibleChatLogs.length === 0 ? <Empty text="이 학생의 AI 튜터 대화 기록이 아직 없습니다." /> : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function StudentSummary({ sessions, simulationLogs, chatLogs }: { sessions: RecordRow[]; simulationLogs: RecordRow[]; chatLogs: RecordRow[] }) {
  const latestSimulation = simulationLogs[0] ?? null;
  const latestState = asRecord(latestSimulation?.["simulation_state"]);
  const latestResult = asRecord(latestSimulation?.["simulation_result"]);
  const prediction = String(latestSimulation?.["student_prediction"] ?? "");
  const atpText = latestResult ? String(latestResult["atpLabel"] ?? latestResult["atpEstimate"] ?? "기록 없음") : "기록 없음";

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <SummaryItem label="학습 세션" value={String(sessions.length)} />
      <SummaryItem label="최근 조건" value={formatCondition(latestState)} chemical />
      <SummaryItem label="ATP 생성" value={atpText} chemical />
      <SummaryItem label="AI 튜터 대화" value={String(chatLogs.length)} />
      <div className="rounded-md border border-slate-200 bg-panel p-4 md:col-span-4">
        <p className="mb-1 text-sm font-semibold text-slate-500">최근 예측</p>
        <p className="text-sm leading-6 text-slate-700">{prediction || "아직 예측 기록이 없습니다."}</p>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, chemical = false }: { label: string; value: string; chemical?: boolean }) {
  return (
    <div className="rounded-md border border-slate-200 bg-panel p-4">
      <p className="mb-1 text-sm font-semibold text-slate-500">{label}</p>
      <p className="text-base font-bold text-ink">{chemical ? <ChemicalText text={value} /> : value}</p>
    </div>
  );
}

function SimulationLogCard({ log }: { log: RecordRow }) {
  const eventType = String(log["event_type"] ?? "simulation");
  const state = asRecord(log["simulation_state"]);
  const result = asRecord(log["simulation_result"]);
  const prediction = String(log["student_prediction"] ?? "");
  const explanation = Array.isArray(result?.["explanation"]) ? (result?.["explanation"] as unknown[]).map(String) : [];
  const atpText = result ? String(result["atpLabel"] ?? result["atpEstimate"] ?? "") : "";

  return (
    <article className="rounded-md border border-slate-200 bg-panel p-4 text-sm leading-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold text-ink">{eventLabel(eventType)}</p>
        <p className="text-xs text-slate-500">{formatDate(log["created_at"])}</p>
      </div>
      <p className="text-slate-600"><span className="font-semibold text-slate-700">조건:</span> <ChemicalText text={formatCondition(state)} /></p>
      {atpText ? <p className="text-slate-600"><span className="font-semibold text-slate-700">결과:</span> <ChemicalText text={atpText} /></p> : null}
      <p className="text-slate-600"><span className="font-semibold text-slate-700">예측:</span> {prediction || "기록 없음"}</p>
      {explanation.length > 0 ? <p className="mt-2 text-slate-600"><ChemicalText text={explanation[0]} /></p> : null}
    </article>
  );
}

function ChatLogCard({ log }: { log: RecordRow }) {
  const role = String(log["role"] ?? "student") === "assistant" ? "AI 튜터" : "학생";
  const message = String(log["message"] ?? "");
  const tags = Array.isArray(log["misconception_tags"]) ? (log["misconception_tags"] as unknown[]).map(String).filter(Boolean) : [];

  return (
    <article className="rounded-md border border-slate-200 bg-panel p-4 text-sm leading-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold text-ink">{role}</p>
        <p className="text-xs text-slate-500">{formatDate(log["created_at"])}</p>
      </div>
      <p className="text-slate-700"><ChemicalText text={message || "대화 내용 없음"} /></p>
      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-coral/10 px-2 py-1 text-xs font-semibold text-coral"><ChemicalText text={tag} /></span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function Metric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500"><Icon size={18} /> {label}</div>
      <p className="text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">{text}</p>;
}

function asRows(value: unknown): RecordRow[] {
  return Array.isArray(value) ? (value as RecordRow[]) : [];
}

function asRecord(value: unknown): RecordRow | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordRow) : null;
}

function getId(row: RecordRow) {
  return String(row["id"] ?? "");
}

function belongsToStudent(row: RecordRow, studentId: string, sessionIds: Set<string>) {
  const rowStudentId = String(row["student_id"] ?? "");
  const rowSessionId = String(row["session_id"] ?? "");
  return rowStudentId === studentId || sessionIds.has(rowSessionId);
}

function studentLabel(student: RecordRow) {
  const number = String(student["student_number"] ?? "").trim();
  const name = String(student["student_name"] ?? "").trim();
  return [number, name].filter(Boolean).join(" ") || "이름 없는 학생";
}

function studentDate(student: RecordRow) {
  return formatDate(student["updated_at"] ?? student["created_at"]);
}

function countTags(logs: RecordRow[]) {
  const counts = new Map<string, number>();
  for (const row of logs) {
    const tags = Array.isArray(row["misconception_tags"]) ? (row["misconception_tags"] as unknown[]).map(String) : [];
    for (const tag of tags) {
      if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

function formatCondition(state: RecordRow | null) {
  if (!state) return "기록 없음";
  return "NADH " + String(state["nadh"] ?? "-") + " · FADH2 " + String(state["fadh2"] ?? "-") + " · 산소 " + oxygenLabel(state["oxygen"]) + " · ADP " + adpLabel(state["adp"]) + " · " + treatmentLabel(state["treatment"]);
}

function oxygenLabel(value: unknown) {
  if (value === "sufficient") return "충분";
  if (value === "low") return "부족";
  if (value === "none") return "없음";
  return "기록 없음";
}

function adpLabel(value: unknown) {
  if (value === "sufficient") return "충분";
  if (value === "low") return "부족";
  return "기록 없음";
}

function treatmentLabel(value: unknown) {
  if (value === "complexI") return "복합체 I 저해";
  if (value === "complexIII") return "복합체 III 저해";
  if (value === "complexIV") return "복합체 IV 저해";
  if (value === "atpSynthase") return "ATP 합성효소 저해";
  if (value === "uncoupler") return "탈공역제";
  return "처리 없음";
}

function eventLabel(value: string) {
  if (value === "simulation_run") return "시뮬레이션 실행";
  if (value === "session_started") return "학습 시작";
  return value;
}

function formatDate(value: unknown) {
  if (!value) return "날짜 없음";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "날짜 없음";
  return date.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function buildExcelWorkbook(students: RecordRow[], sessions: RecordRow[], simulationLogs: RecordRow[], chatLogs: RecordRow[], tagCounts: Array<[string, number]>) {
  const generatedAt = new Date();
  const studentSummaries = buildStudentSummaries(students, sessions, simulationLogs, chatLogs);
  const summaryRows: XmlRow[] = [];

  summaryRows.push([{ value: "산화적 인산화 교사용 대시보드", style: "title", mergeAcross: 7 }]);
  summaryRows.push([{ value: "생성일", style: "label" }, { value: generatedAt.toLocaleString("ko-KR"), mergeAcross: 6 }]);
  summaryRows.push([]);
  summaryRows.push([{ value: "전체 요약", style: "section", mergeAcross: 7 }]);
  summaryRows.push([
    { value: "학생 수", style: "label" }, { value: students.length, type: "Number" },
    { value: "학습 세션", style: "label" }, { value: sessions.length, type: "Number" },
    { value: "시뮬레이션 실행", style: "label" }, { value: simulationLogs.filter((log) => String(log["event_type"] ?? "") === "simulation_run").length, type: "Number" },
    { value: "AI 튜터 대화", style: "label" }, { value: chatLogs.length, type: "Number" }
  ]);
  summaryRows.push([]);
  summaryRows.push([{ value: "학생별 학습 요약", style: "section", mergeAcross: 6 }]);
  summaryRows.push(["학번", "이름", "학습 세션 수", "시뮬레이션 실행 수", "AI 대화 수", "오개념 태그", "최근 활동일"].map((value) => ({ value, style: "header" })));
  for (const summary of studentSummaries) {
    summaryRows.push([
      { value: summary.number },
      { value: summary.name },
      { value: summary.sessionCount, type: "Number" },
      { value: summary.simulationCount, type: "Number" },
      { value: summary.chatCount, type: "Number" },
      { value: summary.tags || "-", style: "wrap" },
      { value: summary.latestDate || "-" }
    ]);
  }
  summaryRows.push([]);
  summaryRows.push([{ value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "전체 주요 오개념 태그", style: "section", mergeAcross: 1 }]);
  summaryRows.push([{ value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "오개념 태그", style: "header" }, { value: "빈도", style: "header" }]);
  for (const [tag, count] of tagCounts) {
    summaryRows.push([{ value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: tag, style: "wrap" }, { value: count, type: "Number" }]);
  }

  const detailRows: XmlRow[] = [];
  detailRows.push([{ value: "학생 로그", style: "title", mergeAcross: 10 }]);
  detailRows.push([{ value: "학번", style: "header" }, { value: "이름", style: "header" }, { value: "학습 일시", style: "header" }, { value: "회차", style: "header" }, { value: "시뮬레이션 조건", style: "header" }, { value: "결과", style: "header" }, { value: "오개념 태그", style: "header" }, { value: "학생 예측", style: "header" }, { value: "학생 질문", style: "header" }, { value: "AI 튜터 메시지", style: "header" }, { value: "학생 활동 문구", style: "header" }]);

  for (const summary of studentSummaries) {
    if (summary.logs.length === 0 && summary.chats.length === 0) {
      detailRows.push([
        { value: summary.number }, { value: summary.name }, { value: "-" }, { value: "-" }, { value: "기록 없음" }, { value: "-" }, { value: summary.tags || "-", style: "wrap" }, { value: "-" }, { value: "-" }, { value: "-" }, { value: "", style: "wrap" }
      ]);
      continue;
    }
    const grouped = buildStudentLogGroups(summary.logs, summary.chats);
    for (const group of grouped) {
      const pairs = pairChatLogs(group.chats);
      const rowBase = [
        { value: summary.number },
        { value: summary.name },
        { value: formatDate(group.log?.["created_at"] ?? group.chats[0]?.["created_at"]) },
        { value: group.round ? String(group.round) + "회차" : "대화" },
        { value: group.log ? formatCondition(asRecord(group.log["simulation_state"])) : "시뮬레이션 전 대화", style: "wrap" },
        { value: group.log ? formatResult(asRecord(group.log["simulation_result"])) : "-", style: "wrap" },
        { value: tagsFromLogs(group.chats) || summary.tags || "-", style: "wrap" },
        { value: group.log ? String(group.log["student_prediction"] ?? "") || "-" : "-", style: "wrap" }
      ];
      if (pairs.length === 0) {
        detailRows.push([...rowBase, { value: "-" }, { value: "-" }, { value: "", style: "wrap" }]);
      } else {
        pairs.forEach((pair, index) => {
          detailRows.push([
            ...(index === 0 ? rowBase : [{ value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }, { value: "" }]),
            { value: pair.question || "-", style: "wrap" },
            { value: pair.answer || "-", style: "wrap" },
            { value: "", style: "wrap" }
          ]);
        });
      }
    }
  }

  return spreadsheetXml([
    { name: "전체 요약", rows: summaryRows, widths: [70, 90, 110, 125, 95, 430, 150, 90] },
    { name: "학생 로그", rows: detailRows, widths: [70, 90, 145, 70, 330, 280, 220, 320, 360, 480, 520] }
  ]);
}

type XmlCell = { value: string | number; type?: "String" | "Number"; style?: string; mergeAcross?: number };
type XmlRow = XmlCell[];

type StudentSummary = {
  id: string;
  number: string;
  name: string;
  sessionIds: Set<string>;
  sessionCount: number;
  simulationCount: number;
  chatCount: number;
  tags: string;
  latestDate: string;
  logs: RecordRow[];
  chats: RecordRow[];
};

function buildStudentSummaries(students: RecordRow[], sessions: RecordRow[], simulationLogs: RecordRow[], chatLogs: RecordRow[]): StudentSummary[] {
  return students.map((student) => {
    const id = getId(student);
    const studentSessions = sessions.filter((session) => String(session["student_id"] ?? "") === id);
    const sessionIds = new Set(studentSessions.map((session) => getId(session)).filter(Boolean));
    const logs = simulationLogs
      .filter((log) => belongsToStudent(log, id, sessionIds) && String(log["event_type"] ?? "") === "simulation_run")
      .sort((a, b) => timeValue(a["created_at"]) - timeValue(b["created_at"]));
    const chats = chatLogs
      .filter((log) => belongsToStudent(log, id, sessionIds))
      .sort((a, b) => timeValue(a["created_at"]) - timeValue(b["created_at"]));
    const latestLog = logs[logs.length - 1] ?? null;
    const tagSummary = countTags(chats).map(([tag, count]) => tag + "(" + String(count) + ")").join(", ");
    const name = String(student["student_name"] ?? "").trim() || "이름 없음";
    const number = String(student["student_number"] ?? "").trim();
    const latestDate = latestLog ? formatDate(latestLog["created_at"]) : formatDate(student["updated_at"] ?? student["created_at"]);
    return {
      id,
      number,
      name,
      sessionIds,
      sessionCount: studentSessions.length,
      simulationCount: logs.length,
      chatCount: chats.length,
      tags: tagSummary,
      latestDate,
      logs,
      chats
    };
  });
}

function buildStudentLogGroups(logs: RecordRow[], chats: RecordRow[]) {
  if (logs.length === 0) return [{ round: 0, log: null as RecordRow | null, chats }];
  return logs.map((log, index) => {
    const start = timeValue(log["created_at"]);
    const next = logs[index + 1] ? timeValue(logs[index + 1]["created_at"]) : Number.POSITIVE_INFINITY;
    const roundChats = chats.filter((chat) => {
      const chatTime = timeValue(chat["created_at"]);
      if (index === 0 && chatTime < start) return true;
      return chatTime >= start && chatTime < next;
    });
    return { round: index + 1, log, chats: roundChats };
  });
}

function pairChatLogs(logs: RecordRow[]) {
  const pairs: Array<{ question: string; answer: string }> = [];
  let pending = "";
  for (const log of logs) {
    const role = String(log["role"] ?? "student");
    const message = String(log["message"] ?? "");
    if (role === "assistant") {
      pairs.push({ question: pending, answer: message });
      pending = "";
    } else {
      if (pending) pairs.push({ question: pending, answer: "" });
      pending = message;
    }
  }
  if (pending) pairs.push({ question: pending, answer: "" });
  return pairs;
}

function tagsFromLogs(logs: RecordRow[]) {
  return countTags(logs).map(([tag, count]) => tag + "(" + String(count) + ")").join(", ");
}

function formatResult(result: RecordRow | null) {
  if (!result) return "기록 없음";
  const explanation = Array.isArray(result["explanation"]) ? (result["explanation"] as unknown[]).map(String).join(" ") : "";
  return "ATP 생성 " + String(result["atpLabel"] ?? result["atpEstimate"] ?? "-") + ", H+ 기울기 " + String(result["protonGradientLevel"] ?? "-") + ", 산소 소비 " + String(result["oxygenConsumptionLevel"] ?? "-") + (explanation ? " / 해석: " + trimText(explanation, 420) : "");
}

function spreadsheetXml(sheets: Array<{ name: string; rows: XmlRow[]; widths: number[] }>) {
  return "<?xml version=\"1.0\"?>" +
    "<?mso-application progid=\"Excel.Sheet\"?>" +
    "<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:x=\"urn:schemas-microsoft-com:office:excel\" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\" xmlns:html=\"http://www.w3.org/TR/REC-html40\">" +
    "<Styles>" +
    "<Style ss:ID=\"Default\"><Alignment ss:Vertical=\"Top\"/><Font ss:FontName=\"Malgun Gothic\" ss:Size=\"10\"/></Style>" +
    "<Style ss:ID=\"title\"><Font ss:FontName=\"Malgun Gothic\" ss:Size=\"16\" ss:Bold=\"1\" ss:Color=\"#122022\"/><Interior ss:Color=\"#DFF2EC\" ss:Pattern=\"Solid\"/><Alignment ss:Vertical=\"Center\" ss:WrapText=\"1\"/></Style>" +
    "<Style ss:ID=\"section\"><Font ss:FontName=\"Malgun Gothic\" ss:Size=\"12\" ss:Bold=\"1\" ss:Color=\"#176B87\"/><Interior ss:Color=\"#F1FAF7\" ss:Pattern=\"Solid\"/><Alignment ss:WrapText=\"1\"/></Style>" +
    "<Style ss:ID=\"header\"><Font ss:FontName=\"Malgun Gothic\" ss:Bold=\"1\" ss:Color=\"#FFFFFF\"/><Interior ss:Color=\"#176B87\" ss:Pattern=\"Solid\"/><Alignment ss:Vertical=\"Center\" ss:WrapText=\"1\"/><Borders><Border ss:Position=\"Bottom\" ss:LineStyle=\"Continuous\" ss:Weight=\"1\" ss:Color=\"#0F4F63\"/></Borders></Style>" +
    "<Style ss:ID=\"label\"><Font ss:FontName=\"Malgun Gothic\" ss:Bold=\"1\"/><Interior ss:Color=\"#EEF7F3\" ss:Pattern=\"Solid\"/><Alignment ss:WrapText=\"1\"/></Style>" +
    "<Style ss:ID=\"wrap\"><Alignment ss:Vertical=\"Top\" ss:WrapText=\"1\"/></Style>" +
    "</Styles>" +
    sheets.map((sheet) => worksheetXml(sheet.name, sheet.rows, sheet.widths)).join("") +
    "</Workbook>";
}

function worksheetXml(name: string, rows: XmlRow[], widths: number[]) {
  return "<Worksheet ss:Name=\"" + escapeXml(name) + "\"><Table>" +
    widths.map((width) => "<Column ss:Width=\"" + String(width) + "\"/>").join("") +
    rows.map(rowXml).join("") +
    "</Table><WorksheetOptions xmlns=\"urn:schemas-microsoft-com:office:excel\"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>2</SplitHorizontal><TopRowBottomPane>2</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions></Worksheet>";
}

function rowXml(row: XmlRow) {
  if (row.length === 0) return "<Row/>";
  return "<Row ss:AutoFitHeight=\"1\">" + row.map(cellXml).join("") + "</Row>";
}

function cellXml(cell: XmlCell) {
  const type = cell.type ?? (typeof cell.value === "number" ? "Number" : "String");
  const attrs = [cell.style ? "ss:StyleID=\"" + cell.style + "\"" : "", cell.mergeAcross ? "ss:MergeAcross=\"" + String(cell.mergeAcross) + "\"" : ""].filter(Boolean).join(" ");
  return "<Cell" + (attrs ? " " + attrs : "") + "><Data ss:Type=\"" + type + "\">" + escapeXml(trimText(formatChemicalText(String(cell.value ?? "")), 32000)) + "</Data></Cell>";
}

function trimText(value: string, max: number) {
  return value.length > max ? value.slice(0, max - 1) + "…" : value;
}

function timeValue(value: unknown) {
  if (!value) return 0;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatChemicalText(value: string) {
  return value
    .replace(/FADH2/g, "FADH₂")
    .replace(/H2O/g, "H₂O")
    .replace(/O2/g, "O₂")
    .replace(/CO2/g, "CO₂")
    .replace(/NAD\+/g, "NAD⁺")
    .replace(/H\+/g, "H⁺")
    .replace(/e-/g, "e⁻")
    .replace(/e−/g, "e⁻");
}

function escapeXml(value: string) {
  return value.replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[char] ?? char);
}

