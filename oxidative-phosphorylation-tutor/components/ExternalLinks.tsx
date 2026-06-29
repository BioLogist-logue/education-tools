import { ExternalLink } from "lucide-react";

export function ExternalLinks() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href="https://biologue-tools.vercel.app/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-marine/20 bg-white px-3 py-2 text-sm font-semibold text-marine transition hover:bg-marine hover:text-white">
        교육 허브 바로가기 <ExternalLink size={15} />
      </a>
      <a href="https://blog.naver.com/biologue_" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-mint/30 bg-white px-3 py-2 text-sm font-semibold text-mint transition hover:bg-mint hover:text-white">
        블로그 바로가기 <ExternalLink size={15} />
      </a>
    </div>
  );
}
