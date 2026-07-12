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
            <p className="text-sm text-slate-500">이번 세션의 시뮬레이션과 AI 튜터 대화를 PDF로 정리합니다.</p>
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
        <p><ChemicalText text="PDF에는 이번 세션에서 실행한 시뮬레이션 조건과 결과, 학생 예측, AI 튜터 답변이 함께 정리됩니다. NADH와 FADH2 잔량은 포함하지 않습니다." /></p>
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
  const margin = 82;
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
    roundRect(ctx, 48, 48, width - 96, height - 96, 24);
    ctx.fill();
    ctx.strokeStyle = "#dbe5e2";
    ctx.lineWidth = 2;
    ctx.stroke();
    y = margin;
  }

  function finishPage() {
    ctx.fillStyle = "#64748b";
    ctx.font = "24px Malgun Gothic, Apple SD Gothic Neo, sans-serif";
    ctx.fillText("© Copyright 2026 All rights reserved by BioLogist", margin, height - 72);
    ctx.textAlign = "right";
    ctx.fillText(String(pageNumber), width - margin, height - 72);
    ctx.textAlign = "left";
    pages.push({ data: canvas.toDataURL("image/jpeg", 0.92), width, height });
    pageNumber += 1;
  }

  function ensureSpace(space: number) {
    if (y + space < height - 130) return;
    finishPage();
    resetPage();
  }

  function addText(text: string, size: number, color: string, weight: "normal" | "bold" = "normal", lineGap = 1.45) {
    ctx.font = weight + " " + String(size) + "px Malgun Gothic, Apple SD Gothic Neo, sans-serif";
    ctx.fillStyle = color;
    const lines = wrapText(ctx, text, width - margin * 2);
    ensureSpace(lines.length * size * lineGap + 12);
    for (const line of lines) {
      ctx.fillText(line, margin, y);
      y += size * lineGap;
    }
  }

  function addSection(title: string) {
    ensureSpace(72);
    y += 22;
    addText(title, 34, "#176b87", "bold", 1.3);
    y += 8;
  }

  function addCard(lines: string[]) {
    const startY = y;
    const lineHeight = 34;
    const wrapped = lines.flatMap((line) => wrapText(ctx, line, width - margin * 2 - 44));
    ensureSpace(wrapped.length * lineHeight + 54);
    ctx.fillStyle = "#f7fbfb";
    roundRect(ctx, margin, y - 4, width - margin * 2, wrapped.length * lineHeight + 34, 14);
    ctx.fill();
    ctx.strokeStyle = "#d8e4e2";
    ctx.stroke();
    y += 26;
    ctx.font = "24px Malgun Gothic, Apple SD Gothic Neo, sans-serif";
    ctx.fillStyle = "#334155";
    for (const line of wrapped) {
      ctx.fillText(line, margin + 22, y);
      y += lineHeight;
    }
    y = Math.max(y + 18, startY + wrapped.length * lineHeight + 52);
  }

  resetPage();
  addText("산화적 인산화 학습 정리", 46, "#122022", "bold", 1.2);
  addText(student.student_number + " " + student.student_name + " · " + now.toLocaleString("ko-KR"), 24, "#64748b", "normal", 1.5);
  addText("이번 PDF는 현재 학습 세션에서 실행한 시뮬레이션 결과와 AI 튜터 대화를 함께 정리한 파일입니다.", 26, "#334155");

  addSection("세션 요약");
  addCard([
    "시뮬레이션 실행 횟수: " + String(sessionLogs.length),
    "AI 튜터 답변 수: " + String(chatMessages.filter((message) => message.role === "assistant").length),
    "정리 기준: 새 세션으로 시작한 뒤 이 화면에서 수행한 활동"
  ]);

  addSection("시뮬레이션 결과");
  if (sessionLogs.length === 0) {
    addCard(["아직 이 세션에서 실행한 시뮬레이션 기록이 없습니다."]);
  } else {
    sessionLogs.slice().reverse().forEach((log, index) => {
      addCard([
        String(index + 1) + "회차 · " + formatDate(log.created_at),
        "조건: NADH " + String(log.state.nadh) + ", FADH2 " + String(log.state.fadh2) + ", 산소 " + oxygenLabel(log.state.oxygen) + ", ADP " + adpLabel(log.state.adp) + ", " + treatmentLabels[log.state.treatment],
        "결과: ATP 생성 " + log.result.atpLabel + ", H+ 기울기 " + log.result.protonGradientLevel + ", 산소 소비 " + log.result.oxygenConsumptionLevel,
        "학생 예측: " + (log.prediction || "예측을 입력하지 않았습니다."),
        "해석: " + log.result.explanation.join(" ")
      ]);
    });
  }

  addSection("AI 튜터 대화");
  if (chatMessages.length === 0) {
    addCard(["아직 AI 튜터 대화 기록이 없습니다."]);
  } else {
    chatMessages.forEach((message) => {
      addCard([
        (message.role === "assistant" ? "AI 튜터" : "학생") + " · " + formatDate(message.created_at),
        message.message,
        message.misconception_tags?.length ? "태그: " + message.misconception_tags.join(", ") : ""
      ].filter(Boolean));
    });
  }

  finishPage();
  return pages;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const source = String(text || "").replace(/\s+/g, " ").trim();
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

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
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
  void catalogId;

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
  const binary = atob(base64);
  return binary;
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
