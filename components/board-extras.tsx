"use client";

import { useState } from "react";
import { downloadFile, useBlobUrl } from "@/lib/api";

export const NOTICE_FILE_EXTS = ["pdf", "jpg", "jpeg", "png", "gif", "txt", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "hwp", "zip"];
export const EVENT_IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];
export const MAX_NOTICE_FILES = 3;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function fileExt(name: string) {
  return /\.([A-Za-z0-9]+)$/.exec(name)?.[1].toLowerCase() ?? "";
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/** 공지사항 첨부파일: 눌러서 내려받아요 */
export function NoticeFiles({ noticeId, files }: { noticeId: number; files: { id: number; name: string; size: number }[] }) {
  const [error, setError] = useState<string | null>(null);
  if (!files || files.length === 0) return null;
  return (
    <div className="attach">
      <div className="attach-title">첨부파일 {files.length}개</div>
      {files.map((f) => (
        <button
          key={f.id}
          type="button"
          className="attach-file"
          onClick={() => {
            setError(null);
            downloadFile(`/notices/${noticeId}/files/${f.id}`, f.name).catch((e) => setError(e.message));
          }}
        >
          <span aria-hidden>📎</span> {f.name} <span className="attach-size">{formatSize(f.size)}</span>
        </button>
      ))}
      {error && <div className="hint" style={{ color: "var(--danger, #c0392b)" }}>{error}</div>}
    </div>
  );
}

/** 이벤트 이미지 (등록된 경우에만 보여줘요) */
export function EventImage({ eventId, show, small }: { eventId: number; show: boolean; small?: boolean }) {
  const url = useBlobUrl(show ? `/events/${eventId}/image` : null);
  if (!show || !url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={small ? "event-thumb" : "event-image"} src={url} alt="이벤트 이미지" />;
}

/** 이벤트 링크 버튼 */
export function EventLink({ url }: { url?: string | null }) {
  if (!url) return null;
  return (
    <a className="btn primary event-link" href={url} target="_blank" rel="noopener noreferrer">
      🔗 이벤트 링크 열기
    </a>
  );
}
