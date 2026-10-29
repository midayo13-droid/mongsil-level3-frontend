/** "2026-10-26" 또는 ISO 날짜를 "2026.10.26" 으로 보여 줘요. */
export function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = value.slice(0, 10);
  return d.replaceAll("-", ".");
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${p(date.getMonth() + 1)}.${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
}

export function formatPrice(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return `${value.toLocaleString("ko-KR")}원`;
}

export function todayString() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 입력하는 동안 전화번호를 010-1234-5678 모양으로 정리해요. 숫자 외 글자는 지워요. */
export function formatPhoneInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/** 숫자 칸: 숫자가 아닌 글자는 입력되지 않게 지워요. allowDot 이면 소수점 한 개까지 허용 */
export function onlyNumber(value: string, allowDot = false) {
  if (!allowDot) return value.replace(/\D/g, "");
  const cleaned = value.replace(/[^\d.]/g, "");
  const [head, ...rest] = cleaned.split(".");
  return rest.length > 0 ? `${head}.${rest.join("").slice(0, 1)}` : head;
}
