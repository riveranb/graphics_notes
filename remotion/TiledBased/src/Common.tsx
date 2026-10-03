import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLS, ROWS, TILE, TILE_COLS, TRIANGLES, Vec2 } from "./Geometry";

export const FONT = '"PingFang TC", "Noto Sans TC", "Helvetica Neue", Arial, sans-serif';

export const COLOR = {
    bg: "#0d1017",
    empty: "#1a2030",
    panel: "#121722",
    border: "#2c3445",
    dim: "#8b94a7",
    accent: "#ffd166",
    bad: "#ff6b6b",
    good: "#7ee787",
    geo: "#a78bfa", // Geometry 資料（Vertex / Primitive List），刻意不用三角形的顏色
} as const;

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Depth 視覺化：越近越亮
export const depthGray = (z: number): string => {
    const v = Math.round(interpolate(z, [0, 1], [235, 80]));
    return `rgb(${v}, ${v}, ${v + 10})`;
};

// ---- Layout (1920x1080) ----
export const PX = 44;
export const SCREEN = { x: 100, y: 220, w: COLS * PX, h: ROWS * PX };
export const GPU = { x: 920, y: 220, w: 900, h: 300 };
export const DRAM = { x: 920, y: 545, w: 900, h: 260 };
export const DRAM_CELL = 11;
export const DRAM_GRID = { x: DRAM.x + 36, y: DRAM.y + 62 };
export const DRAM_SIDE = { x: DRAM.x + 236, y: DRAM.y + 56 }; // IMR: Depth Buffer；TBR: Geometry
export const STAT_COL1 = DRAM.x + 400;
export const STAT_COL2 = DRAM.x + 660;

type Box = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

export const screenCenter = (x: number, y: number): Vec2 => {
    return [SCREEN.x + (x + 0.5) * PX, SCREEN.y + (y + 0.5) * PX];
};

export const dramCenter = (x: number, y: number): Vec2 => {
    return [DRAM_GRID.x + (x + 0.5) * DRAM_CELL, DRAM_GRID.y + (y + 0.5) * DRAM_CELL];
};

export const tileOrigin = (k: number): Vec2 => {
    return [SCREEN.x + (k % TILE_COLS) * TILE * PX, SCREEN.y + Math.floor(k / TILE_COLS) * TILE * PX];
};

// ---- HTML layers ----
export const Stage: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => {
    return (
        <AbsoluteFill style={{ backgroundColor: COLOR.bg, fontFamily: FONT, color: "white" }}>
            {children}
        </AbsoluteFill>
    );
};

export const Title: React.FC<{ readonly title: string; readonly subtitle: string }> = ({ title, subtitle }) => {
    const frame = useCurrentFrame();
    return (
        <div style={{ position: "absolute", left: 100, top: 60, opacity: interpolate(frame, [0, 15], [0, 1], CLAMP) }}>
            <div style={{ fontSize: 64, fontWeight: 700 }}>{title}</div>
            <div style={{ fontSize: 32, color: COLOR.dim, marginTop: 6 }}>{subtitle}</div>
        </div>
    );
};

export type Cue = { readonly from: number; readonly text: string };

export const Caption: React.FC<{ readonly cues: readonly Cue[] }> = ({ cues }) => {
    const frame = useCurrentFrame();
    const cue = [...cues].reverse().find((c) => c.from <= frame);
    if (!cue) {
        return null;
    }
    return (
        <div
            style={{
                position: "absolute",
                left: 100,
                top: 830,
                width: 1720,
                fontSize: 40,
                lineHeight: 1.45,
                opacity: interpolate(frame, [cue.from, cue.from + 10], [0, 1], CLAMP),
            }}
        >
            {cue.text}
        </div>
    );
};

export const Footnote: React.FC<{ readonly text: string }> = ({ text }) => {
    return (
        <div style={{ position: "absolute", left: 100, top: 1010, fontSize: 22, color: "#5d6577" }}>{text}</div>
    );
};

export const Legend: React.FC = () => {
    return (
        <div style={{ position: "absolute", left: SCREEN.x, top: SCREEN.y + SCREEN.h + 12, fontSize: 24, color: COLOR.dim }}>
            Q1、Q2 = 背景 Quad · 提交順序 Q1 → Q2 → A → B → C
        </div>
    );
};

export const Label: React.FC<{ readonly x: number; readonly y: number; readonly text: string; readonly size?: number }> = ({
    x,
    y,
    text,
    size = 20,
}) => {
    return <div style={{ position: "absolute", left: x, top: y, fontSize: size, color: COLOR.dim, whiteSpace: "nowrap" }}>{text}</div>;
};

export const Panel: React.FC<{ readonly box: Box; readonly label: string; readonly active?: boolean }> = ({
    box,
    label,
    active,
}) => {
    return (
        <div
            style={{
                position: "absolute",
                left: box.x,
                top: box.y,
                width: box.w,
                height: box.h,
                boxSizing: "border-box",
                border: `2px solid ${active ? COLOR.accent : COLOR.border}`,
                borderRadius: 16,
                backgroundColor: COLOR.panel,
            }}
        >
            <div style={{ position: "absolute", left: 24, top: 14, fontSize: 26, fontWeight: 600, color: COLOR.dim }}>
                {label}
            </div>
        </div>
    );
};

export const Stat: React.FC<{
    readonly x: number;
    readonly y: number;
    readonly label: string;
    readonly value: string | number;
    readonly color: string;
    readonly size: number;
    readonly note?: string;
}> = ({ x, y, label, value, color, size, note }) => {
    return (
        <div style={{ position: "absolute", left: x, top: y, whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 22, color: COLOR.dim }}>{label}</div>
            <div style={{ fontSize: size, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
                {value}
            </div>
            {note ? <div style={{ fontSize: 20, color: COLOR.dim }}>{note}</div> : null}
        </div>
    );
};

export const Chips: React.FC<{
    readonly x: number;
    readonly y: number;
    readonly items: readonly string[];
    readonly active: boolean;
    readonly opacity?: number;
}> = ({ x, y, items, active, opacity = 1 }) => {
    return (
        <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 14, opacity }}>
            {items.map((item, i) => (
                <React.Fragment key={item}>
                    {i > 0 ? <span style={{ fontSize: 30, color: COLOR.dim }}>→</span> : null}
                    <span
                        style={{
                            fontSize: 26,
                            padding: "10px 18px",
                            borderRadius: 10,
                            border: `2px solid ${active ? COLOR.accent : COLOR.border}`,
                            color: active ? "white" : COLOR.dim,
                        }}
                    >
                        {item}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
};

// ---- SVG layers ----
export const FullSvg: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => {
    return (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
            {children}
        </svg>
    );
};

export const Cells: React.FC<{
    readonly ox: number;
    readonly oy: number;
    readonly cell: number;
    readonly cols: number;
    readonly rows: number;
    readonly colorAt: (x: number, y: number) => string;
}> = ({ ox, oy, cell, cols, rows, colorAt }) => {
    const rects: React.ReactNode[] = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            rects.push(
                <rect
                    key={`${x}-${y}`}
                    x={ox + x * cell + 1}
                    y={oy + y * cell + 1}
                    width={cell - 2}
                    height={cell - 2}
                    rx={cell * 0.12}
                    fill={colorAt(x, y)}
                />,
            );
        }
    }
    return <g>{rects}</g>;
};

export const TriOutline: React.FC<{ readonly index: number; readonly progress: number; readonly opacity: number }> = ({
    index,
    progress,
    opacity,
}) => {
    const t = TRIANGLES[index];
    const pts = t.v.map(([x, y]) => [SCREEN.x + x * PX, SCREEN.y + y * PX] as const);
    const len = pts.reduce((sum, p, i) => {
        const q = pts[(i + 1) % 3];
        return sum + Math.hypot(q[0] - p[0], q[1] - p[1]);
    }, 0);
    return (
        <polygon
            points={pts.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke={index < 2 ? "#aab6d3" : t.color}
            strokeWidth={4}
            strokeLinejoin="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - progress)}
            opacity={opacity}
        />
    );
};
