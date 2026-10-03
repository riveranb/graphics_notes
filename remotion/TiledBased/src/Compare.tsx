import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { CLAMP, COLOR, Caption, Footnote, FullSvg, Stage, Title } from "./Common";
import { IMR_ACCESS, IMR_FRAGMENTS } from "./Imr";
import { TBR_ACCESS, TBR_FRAGMENTS, TBR_LIST, TBR_VERTEX } from "./Tbr";

export const COMPARE_DURATION = 160; // 字幕出現（第 130 格）後停 1 秒

// Emphasis 形式：IMR 淡化灰、TBR 強調色；單一指標、單一 Baseline
const BAR_X = 300;
const BAR_MAX = 1200;
const BAR_H = 24;
const IMR_GRAY = "#6b7385";
const BARS = [
    { label: "IMR", value: IMR_ACCESS, color: IMR_GRAY, y: 300, from: 15 },
    { label: "TBR", value: TBR_ACCESS, color: COLOR.accent, y: 380, from: 30 },
] as const;
const SAVED = Math.round((1 - TBR_ACCESS / IMR_ACCESS) * 100);

// 4px 圓角只在資料端，Baseline 端保持直角
const barPath = (x: number, y: number, len: number): string => {
    const r = Math.min(4, len);
    return `M ${x} ${y} H ${x + len - r} Q ${x + len} ${y} ${x + len} ${y + r} V ${y + BAR_H - r} Q ${x + len} ${y + BAR_H} ${x + len - r} ${y + BAR_H} H ${x} Z`;
};

const ROWS = [
    { name: "Fragment Shader 次數", imr: `${IMR_FRAGMENTS}`, tbr: `${TBR_FRAGMENTS}`, note: "TBR 本身不減少 Fragment" },
    { name: "Framebuffer DRAM Access", imr: `${IMR_ACCESS}`, tbr: `${TBR_ACCESS}`, note: "Depth 不寫回，Color 每個 Tile 寫一次" },
    { name: "Vertex Data 寫 / 讀", imr: "0", tbr: `${TBR_VERTEX.write} / ${TBR_VERTEX.read}`, note: "Binning 的代價（IMR 沒有）" },
    { name: "Primitive List 寫 / 讀", imr: "0", tbr: `${TBR_LIST.write} / ${TBR_LIST.read}`, note: "Binning 的代價（IMR 沒有）" },
] as const;
const TABLE_Y = 480;
const ROW_H = 60;
const COL = { name: 100, imr: 820, tbr: 1060, note: 1340 } as const;

export const Compare: React.FC = () => {
    const frame = useCurrentFrame();
    const grow = (from: number) => interpolate(frame, [from, from + 30], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });

    return (
        <Stage>
            <Title title="IMR vs TBR：同一個場景" subtitle="Fragment 數量相同，差在 Framebuffer 的資料搬到哪裡" />
            <div style={{ position: "absolute", left: 100, top: 228, fontSize: 30, fontWeight: 600 }}>Framebuffer DRAM Access（簡化單位）</div>
            {BARS.map((b) => {
                const len = (b.value / IMR_ACCESS) * BAR_MAX * grow(b.from);
                return (
                    <React.Fragment key={b.label}>
                        <div style={{ position: "absolute", left: 100, top: b.y - 10, fontSize: 34, fontWeight: 700 }}>{b.label}</div>
                        <div
                            style={{
                                position: "absolute",
                                left: BAR_X + len + 16,
                                top: b.y - 12,
                                fontSize: 34,
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                                opacity: grow(b.from),
                            }}
                        >
                            {Math.round(b.value * grow(b.from))}
                            {b.label === "TBR" ? <span style={{ fontSize: 26, color: COLOR.dim, fontWeight: 400 }}>（−{SAVED}%）</span> : null}
                        </div>
                    </React.Fragment>
                );
            })}

            {/* 對照表（同時是數值的 Table View） */}
            {[{ name: "指標", imr: "IMR", tbr: "TBR", note: "說明" }, ...ROWS].map((r, i) => {
                const header = i === 0;
                const y = TABLE_Y + i * ROW_H;
                const opacity = interpolate(frame, [60 + i * 12, 72 + i * 12], [0, 1], CLAMP);
                const cell = { position: "absolute", top: y, fontSize: header ? 24 : 30, color: header ? COLOR.dim : "white", opacity } as const;
                return (
                    <React.Fragment key={r.name}>
                        <div style={{ ...cell, left: COL.name }}>{r.name}</div>
                        <div style={{ ...cell, left: COL.imr, fontVariantNumeric: "tabular-nums" }}>{r.imr}</div>
                        <div style={{ ...cell, left: COL.tbr, fontVariantNumeric: "tabular-nums", fontWeight: header ? 400 : 700 }}>{r.tbr}</div>
                        <div style={{ ...cell, left: COL.note, fontSize: header ? 24 : 24, color: COLOR.dim, top: y + (header ? 0 : 4) }}>{r.note}</div>
                    </React.Fragment>
                );
            })}

            <FullSvg>
                <line x1={BAR_X} y1={280} x2={BAR_X} y2={424} stroke={COLOR.border} strokeWidth={1} />
                {BARS.map((b) => {
                    const len = (b.value / IMR_ACCESS) * BAR_MAX * grow(b.from);
                    return len > 0 ? <path key={b.label} d={barPath(BAR_X, b.y, len)} fill={b.color} /> : null;
                })}
                {ROWS.map((r, i) => (
                    <line
                        key={r.name}
                        x1={100}
                        y1={TABLE_Y + (i + 1) * ROW_H - 12}
                        x2={1820}
                        y2={TABLE_Y + (i + 1) * ROW_H - 12}
                        stroke={COLOR.border}
                        strokeWidth={1}
                        opacity={interpolate(frame, [60 + i * 12, 72 + i * 12], [0, 1], CLAMP)}
                    />
                ))}
            </FullSvg>

            <Caption
                cues={[
                    {
                        from: 120,
                        text: "TBR 用少量 Geometry 讀寫，換掉大量 Framebuffer 讀寫；三角形越多、跨越越多 Tile，Geometry 的代價越明顯",
                    },
                ]}
            />
            <Footnote text="概念示意 · 計數為簡化單位，各列單位不同，不可跨列相加 · 忽略 Cache / Framebuffer Compression / HSR" />
        </Stage>
    );
};
