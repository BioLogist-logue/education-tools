"use client";

import { ClipboardList, Download } from "lucide-react";
import { ChemicalText } from "@/components/ChemicalText";
import { treatmentLabels } from "@/lib/simulation";
import type { ChatMessage, SimulationResult, SimulationState, StudentProfile } from "@/lib/types";

export interface SessionSimulationLog {
  id: string;
  state: SimulationState;
  result: SimulationResult;
  prediction: string;
  created_at: string;
}

interface LearningLogPanelProps {
  student: StudentProfile;
  sessionLogs: SessionSimulationLog[];
  chatMessages: ChatMessage[];
}

interface DialoguePair {
  question: string;
  answer: string;
}

interface RoundGroup {
  round: number;
  log: SessionSimulationLog;
  chats: ChatMessage[];
  pairs: DialoguePair[];
}

export function LearningLogPanel({ student, sessionLogs, chatMessages }: LearningLogPanelProps) {
  const latestLog = sessionLogs[0] ?? null;
  const tutorReplies = chatMessages.filter((message) => message.role === "assistant");

  async function downloadSummary() {
    const now = new Date();
    const pdf = await buildSummaryPdf(student, sessionLogs, chatMessages, now);
    const url = URL.createObjectURL(pdf);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = sanitizeFileName(student.student_number + "_" + student.student_name + "_산화적인산화.pdf");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-amber/15 p-2 text-amber"><ClipboardList size={20} /></span>
          <div>
            <h2 className="text-lg font-bold text-ink">학습 로그</h2>
            <p className="text-sm text-slate-500">회차별 시뮬레이션 결과와 AI 튜터 대화를 PDF로 정리합니다.</p>
          </div>
        </div>
        <button type="button" onClick={downloadSummary} className="inline-flex items-center gap-2 rounded-md bg-marine px-3 py-2 text-sm font-semibold text-white transition hover:bg-marine/90">
          <Download size={16} /> PDF 정리 파일 다운로드
        </button>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <LogItem label="이번 세션 실행 횟수" value={String(sessionLogs.length)} />
        <LogItem label="AI 튜터 답변" value={String(tutorReplies.length)} />
        <LogItem label="최근 처리 조건" value={latestLog ? treatmentLabels[latestLog.state.treatment] : "기록 없음"} />
        <LogItem label="최근 ATP 생성" value={latestLog ? latestLog.result.atpLabel : "기록 없음"} />
      </div>
      <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        <p className="mb-1 font-bold text-slate-800">최근 학생 예측</p>
        <p><ChemicalText text={latestLog?.prediction || "아직 예측이 입력되지 않았습니다."} /></p>
      </div>
      <div className="mt-4 rounded-md bg-mint/10 p-4 text-sm leading-6 text-slate-700">
        <p className="mb-1 font-bold text-mint">다운로드 내용</p>
        <p><ChemicalText text="PDF에는 회차별 조건, 결과, 해석, 그리고 해당 회차 뒤에 이어진 학생 질문과 AI 튜터 답변이 표로 정리됩니다." /></p>
      </div>
    </section>
  );
}

function LogItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-panel p-3">
      <p className="text-xs font-semibold text-slate-500"><ChemicalText text={label} /></p>
      <p className="mt-1 font-bold text-ink"><ChemicalText text={value} /></p>
    </div>
  );
}

async function buildSummaryPdf(student: StudentProfile, sessionLogs: SessionSimulationLog[], chatMessages: ChatMessage[], now: Date) {
  const pages = await renderPages(student, sessionLogs, chatMessages, now);
  return createPdfFromJpegs(pages);
}

async function renderPages(student: StudentProfile, sessionLogs: SessionSimulationLog[], chatMessages: ChatMessage[], now: Date) {
  const width = 1240;
  const height = 1754;
  const margin = 74;
  const contentWidth = width - margin * 2;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const rawContext = canvas.getContext("2d");
  if (!rawContext) throw new Error("PDF 생성을 위한 화면 캔버스를 만들 수 없습니다.");
  const ctx: CanvasRenderingContext2D = rawContext;

  const pages: { data: string; width: number; height: number }[] = [];
  let y = margin;
  let pageNumber = 1;

  function resetPage() {
    ctx.fillStyle = "#eef7f3";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 44, 44, width - 88, height - 88, 24);
    ctx.fill();
    ctx.strokeStyle = "#dbe5e2";
    ctx.lineWidth = 2;
    ctx.stroke();
    y = margin;
  }

  function finishPage() {
    ctx.fillStyle = "#64748b";
    ctx.font = font(22, "normal");
    ctx.fillText("© Copyright 2026 All rights reserved by BioLogist", margin, height - 68);
    ctx.textAlign = "right";
    ctx.fillText(String(pageNumber), width - margin, height - 68);
    ctx.textAlign = "left";
    pages.push({ data: canvas.toDataURL("image/jpeg", 0.92), width, height });
    pageNumber += 1;
  }

  function ensureSpace(space: number) {
    if (y + space < height - 126) return;
    finishPage();
    resetPage();
  }

  function addText(text: string, size: number, color: string, weight: "normal" | "bold" = "normal", lineGap = 1.45) {
    ctx.font = font(size, weight);
    ctx.fillStyle = color;
    const lines = wrapText(ctx, text, contentWidth);
    ensureSpace(lines.length * size * lineGap + 16);
    for (const line of lines) {
      ctx.fillText(line, margin, y);
      y += size * lineGap;
    }
  }

  function addRoundHeader(group: RoundGroup) {
    ensureSpace(86);
    y += 18;
    ctx.fillStyle = "#176b87";
    roundRect(ctx, margin, y, contentWidth, 58, 12);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = font(28, "bold");
    ctx.fillText(String(group.round) + "회차 시뮬레이션", margin + 24, y + 38);
    ctx.textAlign = "right";
    ctx.font = font(21, "normal");
    ctx.fillText(formatDate(group.log.created_at), margin + contentWidth - 24, y + 37);
    ctx.textAlign = "left";
    y += 78;
  }

  function addSubTitle(title: string) {
    ensureSpace(48);
    ctx.fillStyle = "#122022";
    ctx.font = font(25, "bold");
    ctx.fillText(title, margin, y);
    y += 38;
  }

  function drawKeyValueTable(rows: Array<{ label: string; value: string }>) {
    const labelWidth = 168;
    const valueWidth = contentWidth - labelWidth;
    for (const row of rows) {
      ctx.font = font(22, "normal");
      const allLines = wrapText(ctx, row.value, valueWidth - 34);
      let start = 0;
      let firstChunk = true;
      while (start < allLines.length) {
        let available = height - 132 - y;
        if (available < 92) {
          finishPage();
          resetPage();
          available = height - 132 - y;
        }
        const maxLines = Math.max(1, Math.floor((available - 28) / 30));
        const chunk = allLines.slice(start, start + maxLines);
        const rowHeight = Math.max(64, chunk.length * 30 + 30);
        ctx.fillStyle = "#e8f5f1";
        ctx.fillRect(margin, y, labelWidth, rowHeight);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(margin + labelWidth, y, valueWidth, rowHeight);
        ctx.strokeStyle = "#cbdad6";
        ctx.strokeRect(margin, y, contentWidth, rowHeight);
        ctx.beginPath();
        ctx.moveTo(margin + labelWidth, y);
        ctx.lineTo(margin + labelWidth, y + rowHeight);
        ctx.stroke();
        ctx.fillStyle = "#176b87";
        ctx.font = font(22, "bold");
        ctx.fillText(firstChunk ? row.label : row.label + " 계속", margin + 18, y + 39);
        ctx.fillStyle = "#334155";
        ctx.font = font(22, "normal");
        let textY = y + 39;
        for (const line of chunk) {
          ctx.fillText(line, margin + labelWidth + 18, textY);
          textY += 30;
        }
        y += rowHeight;
        start += chunk.length;
        firstChunk = false;
      }
    }
    y += 28;
  }

  function drawDialogueTable(pairs: DialoguePair[], roundLabel: string) {
    if (pairs.length === 0) {
      drawNote("이 회차 이후 기록된 AI 튜터 대화가 없습니다.");
      return;
    }
    const questionWidth = Math.floor(contentWidth * 0.42);
    const answerWidth = contentWidth - questionWidth;

    function drawHeader() {
      ensureSpace(58);
      ctx.fillStyle = "#122022";
      ctx.fillRect(margin, y, contentWidth, 48);
      ctx.fillStyle = "#ffffff";
      ctx.font = font(22, "bold");
      ctx.fillText("학생 질문·요청", margin + 18, y + 32);
      ctx.fillText("AI 튜터 답변", margin + questionWidth + 18, y + 32);
      y += 48;
    }

    drawHeader();
    for (const pair of pairs) {
      ctx.font = font(21, "normal");
      const qLines = wrapText(ctx, pair.question || "질문 기록 없음", questionWidth - 34);
      const aLines = wrapText(ctx, pair.answer || "답변 기록 없음", answerWidth - 34);
      let qStart = 0;
      let aStart = 0;
      let firstChunk = true;
      while (qStart < qLines.length || aStart < aLines.length) {
        let available = height - 132 - y;
        if (available < 110) {
          finishPage();
          resetPage();
          addText(roundLabel + " 대화 계속", 25, "#176b87", "bold", 1.25);
          drawHeader();
          available = height - 132 - y;
        }
        const maxLines = Math.max(1, Math.floor((available - 34) / 30));
        const qChunk = qLines.slice(qStart, qStart + maxLines);
        const aChunk = aLines.slice(aStart, aStart + maxLines);
        const rowLines = Math.max(qChunk.length, aChunk.length, 1);
        const rowHeight = Math.max(72, rowLines * 30 + 34);
        ctx.fillStyle = firstChunk ? "#ffffff" : "#fbfdfc";
        ctx.fillRect(margin, y, contentWidth, rowHeight);
        ctx.strokeStyle = "#cbdad6";
        ctx.strokeRect(margin, y, contentWidth, rowHeight);
        ctx.beginPath();
        ctx.moveTo(margin + questionWidth, y);
        ctx.lineTo(margin + questionWidth, y + rowHeight);
        ctx.stroke();
        ctx.fillStyle = "#334155";
        ctx.font = font(21, "normal");
        let qY = y + 39;
        for (const line of qChunk) {
          ctx.fillText(line, margin + 18, qY);
          qY += 30;
        }
        let aY = y + 39;
        for (const line of aChunk) {
          ctx.fillText(line, margin + questionWidth + 18, aY);
          aY += 30;
        }
        y += rowHeight;
        qStart += qChunk.length;
        aStart += aChunk.length;
        firstChunk = false;
      }
    }
    y += 30;
  }

  function drawNote(text: string) {
    ctx.font = font(22, "normal");
    const lines = wrapText(ctx, text, contentWidth - 42);
    const boxHeight = Math.max(68, lines.length * 30 + 34);
    ensureSpace(boxHeight + 22);
    ctx.fillStyle = "#f7fbfb";
    roundRect(ctx, margin, y, contentWidth, boxHeight, 12);
    ctx.fill();
    ctx.strokeStyle = "#d8e4e2";
    ctx.stroke();
    ctx.fillStyle = "#64748b";
    let textY = y + 40;
    for (const line of lines) {
      ctx.fillText(line, margin + 22, textY);
      textY += 30;
    }
    y += boxHeight + 24;
  }

  resetPage();
  addText("산화적 인산화 학습 정리", 46, "#122022", "bold", 1.2);
  addText(student.student_number + " " + student.student_name + " · " + now.toLocaleString("ko-KR"), 24, "#64748b", "normal", 1.45);
  addText("이번 정리 파일은 회차별 시뮬레이션 결과와 그 뒤에 이어진 AI 튜터 대화를 함께 묶어 정리합니다.", 25, "#334155", "normal", 1.45);
  y += 20;

  const groups = buildRoundGroups(sessionLogs, chatMessages);
  if (groups.length === 0) {
    addSubTitle("시뮬레이션 결과");
    drawNote("아직 이 세션에서 실행한 시뮬레이션 기록이 없습니다. 시뮬레이션을 실행한 뒤 PDF를 다시 내려받으면 회차별 표가 만들어집니다.");
  } else {
    for (const group of groups) {
      addRoundHeader(group);
      addSubTitle("시뮬레이션 결과 표");
      drawKeyValueTable([
        { label: "조건", value: conditionSummary(group.log.state) },
        { label: "결과", value: resultSummary(group.log.result) },
        { label: "학생 예측", value: group.log.prediction || "예측을 입력하지 않았습니다." },
        { label: "해석", value: group.log.result.explanation.join(" ") }
      ]);
      addSubTitle("AI 튜터 대화 기록");
      drawDialogueTable(group.pairs, String(group.round) + "회차");
    }
  }

  finishPage();
  return pages;
}

function buildRoundGroups(sessionLogs: SessionSimulationLog[], chatMessages: ChatMessage[]): RoundGroup[] {
  const logs = sessionLogs.slice().sort((a, b) => timeValue(a.created_at) - timeValue(b.created_at));
  const chats = chatMessages.slice().sort((a, b) => timeValue(a.created_at) - timeValue(b.created_at));
  return logs.map((log, index) => {
    const start = timeValue(log.created_at);
    const next = logs[index + 1] ? timeValue(logs[index + 1].created_at) : Number.POSITIVE_INFINITY;
    const roundChats = chats.filter((message) => {
      const messageTime = timeValue(message.created_at);
      if (index === 0 && messageTime < start) return true;
      return messageTime >= start && messageTime < next;
    });
    return {
      round: index + 1,
      log,
      chats: roundChats,
      pairs: pairDialogues(roundChats)
    };
  });
}

function pairDialogues(messages: ChatMessage[]): DialoguePair[] {
  const pairs: DialoguePair[] = [];
  let pendingQuestion = "";
  for (const message of messages) {
    if (message.role === "student") {
      if (pendingQuestion) pairs.push({ question: pendingQuestion, answer: "" });
      pendingQuestion = message.message;
    } else {
      pairs.push({ question: pendingQuestion, answer: message.message });
      pendingQuestion = "";
    }
  }
  if (pendingQuestion) pairs.push({ question: pendingQuestion, answer: "" });
  return pairs;
}

function conditionSummary(state: SimulationState) {
  return "NADH " + String(state.nadh) + "개, FADH2 " + String(state.fadh2) + "개, 산소 " + oxygenLabel(state.oxygen) + ", ADP " + adpLabel(state.adp) + ", 처리 조건 " + treatmentLabels[state.treatment];
}

function resultSummary(result: SimulationResult) {
  return "ATP 생성 " + result.atpLabel + ", H+ 기울기 " + result.protonGradientLevel + ", 산소 소비 " + result.oxygenConsumptionLevel;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const source = formatChemicalText(String(text || "")).replace(/\s+/g, " ").trim();
  if (!source) return [""];
  const words = source.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? current + " " + word : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word);
    }
  }
  if (current) lines.push(current);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function createPdfFromJpegs(pages: { data: string; width: number; height: number }[]) {
  const objects: string[] = [];
  const imageBytes = pages.map((page) => dataUrlToBinary(page.data));

  function addObject(body: string) {
    objects.push(body);
    return objects.length;
  }

  addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("");
  const pageIds: number[] = [];

  pages.forEach((page, index) => {
    const imageId = objects.length + 1;
    addObject("<< /Type /XObject /Subtype /Image /Width " + page.width + " /Height " + page.height + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + imageBytes[index].length + " >>\nstream\n" + imageBytes[index] + "\nendstream");
    const content = "q\n" + page.width + " 0 0 " + page.height + " 0 0 cm\n/Im" + String(index + 1) + " Do\nQ";
    const contentId = addObject("<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream");
    const pageId = addObject("<< /Type /Page /Parent " + pagesId + " 0 R /MediaBox [0 0 " + page.width + " " + page.height + "] /Resources << /XObject << /Im" + String(index + 1) + " " + imageId + " 0 R >> >> /Contents " + contentId + " 0 R >>");
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = "<< /Type /Pages /Kids [" + pageIds.map((id) => String(id) + " 0 R").join(" ") + "] /Count " + pageIds.length + " >>";

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += String(index + 1) + " 0 obj\n" + object + "\nendobj\n";
  });
  const xref = pdf.length;
  pdf += "xref\n0 " + String(objects.length + 1) + "\n0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += String(offsets[index]).padStart(10, "0") + " 00000 n \n";
  }
  pdf += "trailer\n<< /Size " + String(objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + String(xref) + "\n%%EOF";
  return new Blob([binaryStringToUint8Array(pdf)], { type: "application/pdf" });
}

function dataUrlToBinary(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return atob(base64);
}

function binaryStringToUint8Array(binary: string) {
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index) & 255;
  }
  return bytes;
}

function formatDate(value?: string) {
  if (!value) return "시간 기록 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "시간 기록 없음";
  return date.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function timeValue(value?: string) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function oxygenLabel(value: SimulationState["oxygen"]) {
  if (value === "sufficient") return "충분함";
  if (value === "low") return "부족함";
  return "없음";
}

function adpLabel(value: SimulationState["adp"]) {
  return value === "sufficient" ? "충분함" : "부족함";
}

function sanitizeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_");
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

function font(size: number, weight: "normal" | "bold") {
  return weight + " " + String(size) + "px Malgun Gothic, Apple SD Gothic Neo, Arial, sans-serif";
}
