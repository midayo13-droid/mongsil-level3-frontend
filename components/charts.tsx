"use client";

/**
 * 막대 그래프 (외부 라이브러리 없이 HTML/CSS로 그려요).
 * - 막대에 마우스를 올리거나 키보드로 이동하면 값이 보여요.
 * - 가장 큰 막대는 값을 항상 보여 줘요.
 * - 그래프 아래 "표로 보기"로 같은 숫자를 표로도 볼 수 있어요. (화면낭독기·정확한 숫자 확인용)
 */
export interface ChartItem {
  label: string;
  value: number;
  /** 마우스를 올렸을 때 보여 줄 이름 (없으면 label) */
  name?: string;
}

/** 세로 눈금이 4칸으로 딱 떨어지는 최댓값을 구해요. */
function niceScale(max: number, minStep: number) {
  const raw = Math.max(max, minStep * 4) / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  return { step, top: step * 4 };
}

export function formatCount(v: number) {
  return v.toLocaleString("ko-KR");
}
/** 10000 이상은 "만" 단위로 짧게 (눈금용) */
export function formatShortMoney(v: number) {
  if (v === 0) return "0";
  if (v >= 10000) return `${v / 10000}만`;
  return v.toLocaleString("ko-KR");
}

export function BarChart({
  items,
  unit,
  title,
  minStep = 1,
  formatAxis = formatCount,
  formatValue = formatCount,
  showLabel = () => true,
}: {
  items: ChartItem[];
  unit: string;
  title: string;
  minStep?: number;
  formatAxis?: (v: number) => string;
  formatValue?: (v: number) => string;
  showLabel?: (item: ChartItem, index: number) => boolean;
}) {
  const max = Math.max(0, ...items.map((i) => i.value));
  const { top, step } = niceScale(max, minStep);
  const ticks = [0, 1, 2, 3, 4].map((i) => i * step);
  const maxIndex = max > 0 ? items.findIndex((i) => i.value === max) : -1;

  return (
    <figure className="chart" aria-label={title}>
      <div className="chart-y" aria-hidden>
        {ticks.map((t) => (
          <span key={t} style={{ bottom: `${(t / top) * 100}%` }}>
            {formatAxis(t)}
          </span>
        ))}
      </div>
      <div className="chart-area">
        {ticks.slice(1).map((t) => (
          <i key={t} className="chart-grid" style={{ bottom: `${(t / top) * 100}%` }} aria-hidden />
        ))}
        <div className="chart-bars">
          {items.map((it, i) => {
            const pct = (it.value / top) * 100;
            return (
              <div key={`${it.label}-${i}`} className={`chart-col${i === maxIndex ? " peak" : ""}`} tabIndex={0} aria-label={`${it.name ?? it.label}: ${formatValue(it.value)}${unit}`}>
                <span className="chart-val" style={{ bottom: `calc(${pct}% + 4px)` }}>
                  {formatValue(it.value)}
                  {unit}
                </span>
                <span className="chart-bar" style={{ height: `${pct}%` }} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="chart-x" aria-hidden>
        {items.map((it, i) => (
          <span key={`${it.label}-${i}`}>{showLabel(it, i) ? it.label : ""}</span>
        ))}
      </div>
    </figure>
  );
}
