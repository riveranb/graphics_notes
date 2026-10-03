import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLS, Frag, ROWS, TRIANGLES, fragmentsOf } from "./Geometry";
import {
    CLAMP,
    COLOR,
    Caption,
    Cells,
    Chips,
    DRAM,
    DRAM_CELL,
    DRAM_GRID,
    DRAM_SIDE,
    Footnote,
    FullSvg,
    GPU,
    Label,
    Legend,
    PX,
    Panel,
    SCREEN,
    STAT_COL1,
    STAT_COL2,
    Stage,
    Stat,
    Title,
    TriOutline,
    depthGray,
    dramCenter,
    screenCenter,
} from "./Common";

type Ev = Frag & { readonly at: number };

const INTRO = 30;
const OUTLINE = 12;
const FLIGHT = 18;
const OUTRO = 30; // 結尾停 1 秒（Keynote 播完會停在最後一格）
const RATE = [2, 2, 1, 1, 1]; // 每 frame 產生幾個 Fragment（背景快、物件慢）
const ACCESS_PER_FRAG = 3; // Depth Read + Depth Write + Color Write
const DEPTH_CELL = 9;

const buildTimeline = () => {
    const starts: number[] = [];
    const events: Ev[] = [];
    let t = INTRO;
    TRIANGLES.forEach((_, i) => {
        starts.push(t);
        const frags = fragmentsOf(i);
        frags.forEach((f, j) => {
            events.push({ ...f, at: t + OUTLINE + Math.floor(j / RATE[i]) });
        });
        t += OUTLINE + Math.ceil(frags.length / RATE[i]) + 4;
    });
    return { starts, events, end: t + FLIGHT };
};

const { starts, events, end } = buildTimeline();
export const IMR_DURATION = end + OUTRO;
export const IMR_FRAGMENTS = events.length;
export const IMR_ACCESS = events.length * ACCESS_PER_FRAG;

const byPixel: Ev[][] = Array.from({ length: COLS * ROWS }, () => []);
events.forEach((e) => byPixel[e.y * COLS + e.x].push(e));

// 最後一個「已抵達」的 Fragment（delay = 0：剛 Rasterize；delay = FLIGHT：已寫進 DRAM）
const lastTri = (x: number, y: number, frame: number, delay: number): number => {
    let tri = -1;
    for (const e of byPixel[y * COLS + x]) {
        if (e.at + delay <= frame) {
            tri = e.tri;
        }
    }
    return tri;
};

export const Imr: React.FC = () => {
    const frame = useCurrentFrame();
    const shaded = events.filter((e) => e.at <= frame).length;
    const arrived = events.filter((e) => e.at + FLIGHT <= frame).length;
    const flying = events.filter((e) => e.at <= frame && frame < e.at + FLIGHT);
    const flashing = events.filter((e) => e.at <= frame && frame < e.at + 6);
    const current = starts.filter((s) => s <= frame).length - 1;
    const busy = frame >= starts[0] + OUTLINE && frame < end - FLIGHT;

    const screenColor = (x: number, y: number): string => {
        const tri = lastTri(x, y, frame, 0);
        return tri >= 0 ? TRIANGLES[tri].color : COLOR.empty;
    };
    const dramColor = (x: number, y: number): string => {
        const tri = lastTri(x, y, frame, FLIGHT);
        return tri >= 0 ? TRIANGLES[tri].color : COLOR.empty;
    };
    const dramDepth = (x: number, y: number): string => {
        const tri = lastTri(x, y, frame, FLIGHT);
        return tri >= 0 ? depthGray(TRIANGLES[tri].z) : COLOR.empty;
    };

    return (
        <Stage>
            <Title title="Immediate Mode Rendering (IMR)" subtitle="概念模型：三角形畫到哪，DRAM 裡的 Framebuffer 就寫到哪" />
            <Panel box={GPU} label="GPU" active={busy} />
            <Panel box={DRAM} label="DRAM (LPDDR)" active={flying.length > 0} />
            <Chips x={GPU.x + 40} y={GPU.y + 90} items={["Rasterizer", "Fragment Shader", "Depth Test / Blend"]} active={busy} />
            <div style={{ position: "absolute", left: GPU.x + 40, top: GPU.y + 190, fontSize: 26, color: COLOR.dim, lineHeight: 1.5 }}>
                只有小容量 Cache，放不下整張 Framebuffer
                <br />→ 最壞情況：每個 Fragment 的 Depth / Color 都要讀寫 DRAM
            </div>
            <Legend />

            <Label x={DRAM_GRID.x} y={DRAM_GRID.y + ROWS * DRAM_CELL + 6} text="Color Buffer" />
            <Label x={DRAM_SIDE.x} y={DRAM_GRID.y + ROWS * DEPTH_CELL + 6} text="Depth Buffer" />
            <Stat x={STAT_COL1} y={DRAM.y + 18} label="Fragment Shader 次數" value={shaded} color="white" size={44} />
            <Stat
                x={STAT_COL1}
                y={DRAM.y + 118}
                label="Framebuffer Access"
                value={arrived * ACCESS_PER_FRAG}
                color={COLOR.bad}
                size={60}
                note={`= Fragment × ${ACCESS_PER_FRAG}（Depth R/W + Color W）`}
            />
            <Stat x={STAT_COL2} y={DRAM.y + 18} label="Geometry 中間資料" value={0} color={COLOR.geo} size={44} note="直接送 Rasterizer" />

            <FullSvg>
                <Cells ox={SCREEN.x} oy={SCREEN.y} cell={PX} cols={COLS} rows={ROWS} colorAt={screenColor} />
                {flashing.map((e) => (
                    <rect
                        key={`f-${e.tri}-${e.x}-${e.y}`}
                        x={SCREEN.x + e.x * PX + 1}
                        y={SCREEN.y + e.y * PX + 1}
                        width={PX - 2}
                        height={PX - 2}
                        rx={PX * 0.12}
                        fill="white"
                        opacity={interpolate(frame - e.at, [0, 6], [0.8, 0], CLAMP)}
                    />
                ))}
                {starts.map((s, i) =>
                    s <= frame ? (
                        <TriOutline
                            key={TRIANGLES[i].label}
                            index={i}
                            progress={interpolate(frame, [s, s + OUTLINE], [0, 1], CLAMP)}
                            opacity={i === current && frame < end ? 1 : 0.3}
                        />
                    ) : null,
                )}
                <Cells ox={DRAM_GRID.x} oy={DRAM_GRID.y} cell={DRAM_CELL} cols={COLS} rows={ROWS} colorAt={dramColor} />
                <Cells ox={DRAM_SIDE.x} oy={DRAM_GRID.y} cell={DEPTH_CELL} cols={COLS} rows={ROWS} colorAt={dramDepth} />
                {flying.map((e) => {
                    const p = interpolate(frame, [e.at, e.at + FLIGHT], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
                    const [sx, sy] = screenCenter(e.x, e.y);
                    const [dx, dy] = dramCenter(e.x, e.y);
                    const size = interpolate(p, [0, 1], [16, DRAM_CELL - 2]);
                    return (
                        <rect
                            key={`p-${e.tri}-${e.x}-${e.y}`}
                            x={sx + (dx - sx) * p - size / 2}
                            y={sy + (dy - sy) * p - size / 2}
                            width={size}
                            height={size}
                            rx={3}
                            fill={TRIANGLES[e.tri].color}
                            stroke="white"
                            strokeWidth={1.5}
                        />
                    );
                })}
            </FullSvg>
            <Caption
                cues={[
                    { from: 0, text: "三角形依提交順序直接 Rasterize，每個 Fragment 算完立即讀寫 DRAM 裡的 Framebuffer" },
                    { from: starts[2], text: "後畫的三角形蓋掉前面的（Overdraw）：同一個 Pixel 蓋幾層，就要讀寫 DRAM 幾次" },
                    { from: end, text: "Framebuffer 流量 ≈ Fragment 數量 × 每次的 Depth / Color 讀寫（無 Cache 命中的最壞情況）" },
                ]}
            />
            <Footnote text="概念示意 · 16×12 Pixels · 計數為簡化單位，忽略 Cache / Framebuffer Compression / Early-Z 等硬體細節" />
        </Stage>
    );
};
