import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { BINS, COLS, Frag, ROWS, TILE, TILE_COLS, TILE_COUNT, TRIANGLES, tileFragments, tileOf } from "./Geometry";
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
    tileOrigin,
} from "./Common";

type TimedFrag = Frag & { readonly at: number };
type GeoChip = { readonly tri: number; readonly at: number };
type Badge = { readonly tri: number; readonly tile: number; readonly slot: number; readonly at: number; readonly chip: number };
type Point = { readonly x: number; readonly y: number };

type Job = {
    readonly tile: number;
    readonly core: number;
    readonly slow: boolean;
    readonly start: number;
    readonly readEnd: number;
    readonly fillStart: number;
    readonly fillEnd: number;
    readonly storeStart: number;
    readonly end: number;
    readonly frags: readonly TimedFrag[];
};

const INTRO = 30;
const OUTLINE = 12;
const BADGE_GAP = 3;
const TRI_PAD = 10;
const PHASE_GAP = 90; // Binning 完成 → Phase 2 之間的停頓
const SLOW_TILES = 2; // 前兩個 Tile 用單一 Core 放慢講解
const SLOW = 150;
const FAST_GAP = 20;
const CORES = 4; // ponytail: 示意用，實際 Core 數依 GPU 型號而定
const OUTRO = 30; // 結尾停 1 秒（Keynote 播完會停在最後一格）
const VERTS = 3; // 每個三角形寫 3 筆 Vertex（簡化：不共用頂點）

const TILE_PX = TILE * PX;

// GPU 面板：單一 Core 細節 / 多 Core 總覽
const DET_CELL = 40;
const DET_COLOR: Point = { x: GPU.x + 40, y: GPU.y + 66 };
const DET_DEPTH: Point = { x: GPU.x + 220, y: GPU.y + 66 };
const SLOT_CELL = 24;
const slotOrigin = (c: number): Point => ({ x: GPU.x + 30 + c * 212, y: GPU.y + 92 });

// DRAM 面板：Geometry 區（Vertex Data / Primitive List）
const CHIP = 11;
const CHIP_PITCH = 13;
const CHIPS_PER_ROW = 10;
const VERTEX_CHIPS_Y = DRAM_SIDE.y + 26;
const LIST_CHIPS_Y = DRAM_SIDE.y + 86;
const GEO_CENTER: Point = { x: DRAM_SIDE.x + 65, y: DRAM_SIDE.y + 100 };

const makeJob = (tile: number, core: number, start: number, d: number, slow: boolean): Job => {
    const fillStart = start + Math.round(d * 0.2);
    const fillEnd = start + Math.round(d * 0.62);
    const frags = tileFragments(tile);
    return {
        tile,
        core,
        slow,
        start,
        readEnd: start + Math.round(d * 0.12),
        fillStart,
        fillEnd,
        storeStart: start + Math.round(d * 0.68),
        end: start + d,
        frags: frags.map((f, j) => ({
            ...f,
            at: Math.round(interpolate(j, [0, Math.max(frags.length - 1, 1)], [fillStart, fillEnd])),
        })),
    };
};

const buildTimeline = () => {
    const triStarts: number[] = [];
    const vertexChips: GeoChip[] = [];
    const badges: Badge[] = [];
    let t = INTRO;
    TRIANGLES.forEach((_, i) => {
        triStarts.push(t);
        for (let v = 0; v < VERTS; v++) {
            vertexChips.push({ tri: i, at: t + 3 + v * 3 });
        }
        const tiles = BINS.map((list, k) => (list.includes(i) ? k : -1)).filter((k) => k >= 0);
        tiles.forEach((k, j) => {
            badges.push({ tri: i, tile: k, slot: BINS[k].indexOf(i), at: t + OUTLINE + j * BADGE_GAP, chip: badges.length });
        });
        t += OUTLINE + tiles.length * BADGE_GAP + TRI_PAD;
    });
    const binEnd = t;
    const p2Start = binEnd + PHASE_GAP;

    // jobs[k] 對應 Tile k
    const jobs: Job[] = [];
    t = p2Start;
    for (let k = 0; k < SLOW_TILES; k++) {
        jobs.push(makeJob(k, 0, t, SLOW, true));
        t += SLOW;
    }
    // 其餘 Tile：哪個 Core 先空下來就接下一個 Tile（工作量 = Fragment 數，所以完成時間會錯開）
    const fastStart = t + FAST_GAP;
    const coreFree = Array.from({ length: CORES }, () => fastStart);
    for (let k = SLOW_TILES; k < TILE_COUNT; k++) {
        const core = coreFree.indexOf(Math.min(...coreFree));
        const d = 36 + tileFragments(k).length;
        jobs.push(makeJob(k, core, coreFree[core], d, false));
        coreFree[core] += d + 2;
    }
    return { triStarts, vertexChips, badges, binEnd, p2Start, fastStart, jobs, end: Math.max(...jobs.map((j) => j.end)) };
};

const { triStarts, vertexChips, badges, binEnd, p2Start, fastStart, jobs, end } = buildTimeline();
export const TBR_DURATION = end + OUTRO;
export const TBR_FRAGMENTS = jobs.reduce((n, j) => n + j.frags.length, 0);
export const TBR_ACCESS = TILE_COUNT * TILE * TILE;
export const TBR_LIST = { write: badges.length, read: BINS.reduce((n, list) => n + list.length, 0) };
export const TBR_VERTEX = { write: vertexChips.length, read: TBR_LIST.read * VERTS };

const byPixel: TimedFrag[][] = Array.from({ length: COLS * ROWS }, () => []);
jobs.forEach((j) => j.frags.forEach((f) => byPixel[f.y * COLS + f.x].push(f)));

const lastTri = (x: number, y: number, frame: number): number => {
    let tri = -1;
    for (const f of byPixel[y * COLS + x]) {
        if (f.at <= frame) {
            tri = f.tri;
        }
    }
    return tri;
};

const tilePixel = (k: number): Point => ({ x: (k % TILE_COLS) * TILE, y: Math.floor(k / TILE_COLS) * TILE });
const isActive = (j: Job, frame: number): boolean => frame >= j.start && frame < j.end;
const memOrigin = (j: Job): Point => (j.slow ? DET_COLOR : slotOrigin(j.core));
const memCell = (j: Job): number => (j.slow ? DET_CELL : SLOT_CELL);
const empty = (): string => COLOR.empty;

// Tile Memory：Color + Depth 都在 On-chip；Store 時 Color 寫回、Depth 淡出（丟棄）
const TileMem: React.FC<{
    readonly job: Job | undefined;
    readonly frame: number;
    readonly color: Point;
    readonly depth: Point;
    readonly cell: number;
}> = ({ job, frame, color, depth, cell }) => {
    const grid = { cell, cols: TILE, rows: TILE };
    if (!job) {
        return (
            <g opacity={0.3}>
                <Cells ox={color.x} oy={color.y} {...grid} colorAt={empty} />
                <Cells ox={depth.x} oy={depth.y} {...grid} colorAt={empty} />
            </g>
        );
    }
    const p = tilePixel(job.tile);
    const triAt = (lx: number, ly: number) => lastTri(p.x + lx, p.y + ly, frame);
    return (
        <g opacity={interpolate(frame, [job.start, job.readEnd], [0.3, 1], CLAMP)}>
            <Cells ox={color.x} oy={color.y} {...grid} colorAt={empty} />
            <Cells ox={depth.x} oy={depth.y} {...grid} colorAt={empty} />
            <Cells ox={color.x} oy={color.y} {...grid} colorAt={(lx, ly) => (triAt(lx, ly) >= 0 ? TRIANGLES[triAt(lx, ly)].color : "transparent")} />
            <g opacity={interpolate(frame, [job.storeStart, job.end], [1, 0], CLAMP)}>
                <Cells
                    ox={depth.x}
                    oy={depth.y}
                    {...grid}
                    colorAt={(lx, ly) => (triAt(lx, ly) >= 0 ? depthGray(TRIANGLES[triAt(lx, ly)].z) : "transparent")}
                />
            </g>
        </g>
    );
};

// Store：整個 Tile 的 Color 一次寫回 DRAM
const StoreFlight: React.FC<{ readonly job: Job; readonly frame: number }> = ({ job, frame }) => {
    const from = memOrigin(job);
    const cell = memCell(job);
    const p = interpolate(frame, [job.storeStart, job.end], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
    const px = tilePixel(job.tile);
    const toX = DRAM_GRID.x + px.x * DRAM_CELL;
    const toY = DRAM_GRID.y + px.y * DRAM_CELL;
    const s = interpolate(p, [0, 1], [1, DRAM_CELL / cell]);
    const colorAt = (lx: number, ly: number) => {
        const tri = lastTri(px.x + lx, px.y + ly, frame);
        return tri >= 0 ? TRIANGLES[tri].color : COLOR.empty;
    };
    return (
        <g transform={`translate(${from.x + (toX - from.x) * p} ${from.y + (toY - from.y) * p}) scale(${s})`}>
            <rect x={-4} y={-4} width={TILE * cell + 8} height={TILE * cell + 8} rx={8} fill="none" stroke="white" strokeWidth={3 / s} />
            <Cells ox={0} oy={0} cell={cell} cols={TILE} rows={TILE} colorAt={colorAt} />
        </g>
    );
};

// 讀回：此 Tile 的 Primitive List + Vertex Data 從 DRAM 送進 Core
const ReadFlight: React.FC<{ readonly job: Job; readonly frame: number }> = ({ job, frame }) => {
    const to = memOrigin(job);
    const half = (TILE * memCell(job)) / 2;
    const p = interpolate(frame, [job.start, job.readEnd], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
    const x = GEO_CENTER.x + (to.x + half - GEO_CENTER.x) * p;
    const y = GEO_CENTER.y + (to.y + half - GEO_CENTER.y) * p;
    return <rect x={x - 10} y={y - 10} width={20} height={20} rx={4} fill={COLOR.geo} stroke="white" strokeWidth={2} />;
};

export const Tbr: React.FC = () => {
    const frame = useCurrentFrame();
    const inPhase1 = frame < binEnd;
    const active = jobs.filter((j) => isActive(j, frame));
    const slowJob = active.find((j) => j.slow);
    const detailJob = slowJob ?? (frame < p2Start + SLOW ? jobs[0] : jobs[1]);
    const done = (k: number) => frame >= jobs[k].end;

    const shaded = jobs.reduce((n, j) => n + j.frags.filter((f) => f.at <= frame).length, 0);
    const stored = jobs.filter((j) => j.end <= frame).length * TILE * TILE;
    const started = jobs.filter((j) => j.start <= frame);
    const listRead = started.reduce((n, j) => n + BINS[j.tile].length, 0);
    const vertexWrite = vertexChips.filter((c) => c.at <= frame).length;
    const listWrite = badges.filter((b) => b.at <= frame).length;
    const currentTri = triStarts.filter((s) => s <= frame).length - 1;

    const reading = jobs.filter((j) => frame >= j.start && frame < j.readEnd);
    const storing = jobs.filter((j) => frame >= j.storeStart && frame < j.end);
    const readingTris = new Set(reading.flatMap((j) => BINS[j.tile]));
    const readingChips = new Set(badges.filter((b) => reading.some((j) => j.tile === b.tile)).map((b) => b.chip));
    const recentWrite = [...vertexChips, ...badges].some((c) => frame >= c.at && frame < c.at + 8);

    const phase1Opacity = interpolate(frame, [binEnd, binEnd + 15], [1, 0], CLAMP);
    const gapOpacity = interpolate(frame, [binEnd + 5, binEnd + 20, p2Start - 20, p2Start - 5], [0, 1, 1, 0], CLAMP);
    const detailOpacity = interpolate(frame, [p2Start - 10, p2Start, fastStart - 15, fastStart], [0, 1, 1, 0], CLAMP);
    const fastOpacity = interpolate(frame, [fastStart - 5, fastStart + 10], [0, 1], CLAMP);

    const screenColor = (x: number, y: number): string => {
        const tri = lastTri(x, y, frame);
        return tri >= 0 ? TRIANGLES[tri].color : COLOR.empty;
    };
    const dramColor = (x: number, y: number): string => (done(tileOf(x, y)) ? screenColor(x, y) : COLOR.empty);

    const step = (from: number, to: number): string => (slowJob && frame >= from && frame < to ? "white" : COLOR.dim);

    return (
        <Stage>
            <Title title="Tile-Based Rendering (TBR)" subtitle="先 Binning，再逐 Tile 在 On-chip Memory 裡完成 Rendering" />
            <Panel box={GPU} label="GPU" active={inPhase1 || active.length > 0} />
            <Panel box={DRAM} label="DRAM (LPDDR)" active={recentWrite || reading.length > 0 || storing.length > 0} />
            <Legend />

            {/* Phase 1：Geometry + Binning */}
            <Chips x={GPU.x + 40} y={GPU.y + 90} items={["Vertex Shader", "Tiler (Binning)"]} active={inPhase1} opacity={phase1Opacity} />
            <div style={{ position: "absolute", left: GPU.x + 40, top: GPU.y + 190, fontSize: 26, color: COLOR.dim, lineHeight: 1.5, opacity: phase1Opacity }}>
                Vertex 輸出（Position / Varyings）寫到 DRAM
                <br />
                Primitive List：只記錄「哪些三角形影響這個 Tile」，不切開三角形
            </div>

            {/* Phase 1 → 2 */}
            <div style={{ position: "absolute", left: GPU.x + 40, top: GPU.y + 80, opacity: gapOpacity, lineHeight: 1.6 }}>
                <div style={{ fontSize: 44, fontWeight: 700, color: COLOR.good }}>Binning 完成 ✓</div>
                <div style={{ fontSize: 26, color: COLOR.dim }}>
                    Vertex Data {TBR_VERTEX.write} 筆、Primitive List {TBR_LIST.write} 筆已寫入 DRAM
                </div>
                <div style={{ fontSize: 26, color: COLOR.dim }}>所有 Tile 的清單都完整了，才能開始 Phase 2</div>
            </div>

            {/* Phase 2（單一 Core 細節） */}
            <div style={{ opacity: detailOpacity }}>
                <Label x={DET_COLOR.x} y={DET_COLOR.y + 166} text="Color" />
                <Label x={DET_DEPTH.x} y={DET_DEPTH.y + 166} text="Depth" />
                <Label x={DET_COLOR.x} y={DET_COLOR.y + 196} text="Tile Memory (On-chip)" />
                <div style={{ position: "absolute", left: GPU.x + 410, top: GPU.y + 46, fontSize: 24, lineHeight: 1.55, whiteSpace: "nowrap" }}>
                    <div style={{ fontSize: 30, fontWeight: 700, color: COLOR.accent }}>Tile #{detailJob.tile} · Core 0</div>
                    <div style={{ color: step(detailJob.start, detailJob.readEnd) }}>⓪ 讀取 Primitive List + Vertex Data</div>
                    <div style={{ color: step(detailJob.readEnd, detailJob.fillStart) }}>① Load：CLEAR（不讀 DRAM）</div>
                    <div style={{ color: step(detailJob.fillStart, detailJob.storeStart) }}>② Rasterize → Shade → Depth Test</div>
                    <div style={{ color: step(detailJob.storeStart, detailJob.end) }}>③ Store：Color 寫回 DRAM</div>
                    <div style={{ color: step(detailJob.storeStart, detailJob.end), paddingLeft: 30 }}>Depth 丟棄（DONT_CARE）</div>
                </div>
            </div>

            {/* Phase 2（多 Core 平行） */}
            <div style={{ opacity: fastOpacity }}>
                {Array.from({ length: CORES }, (_, c) => {
                    const job = active.find((j) => !j.slow && j.core === c);
                    const o = slotOrigin(c);
                    return (
                        <React.Fragment key={`slot-${c}`}>
                            <div style={{ position: "absolute", left: o.x, top: o.y - 34, fontSize: 20, fontWeight: 600, color: job ? COLOR.accent : COLOR.dim }}>
                                {job ? `Core ${c} · Tile #${job.tile}` : `Core ${c} · 待命`}
                            </div>
                            <div style={{ position: "absolute", left: o.x, top: o.y + 100, fontSize: 16, color: COLOR.dim }}>Color</div>
                            <div style={{ position: "absolute", left: o.x + 106, top: o.y + 100, fontSize: 16, color: COLOR.dim }}>Depth</div>
                        </React.Fragment>
                    );
                })}
                <div style={{ position: "absolute", left: GPU.x + 30, top: GPU.y + 228, fontSize: 22, color: COLOR.dim, lineHeight: 1.45 }}>
                    以 Mali 為例：每個 Shader Core 有自己的 Tile Memory，各自處理不同 Tile
                    <br />
                    Tile 之間互不相依 → 平行處理，誰先做完就接下一個 Tile
                </div>
            </div>

            {/* DRAM */}
            <Label x={DRAM_GRID.x} y={DRAM_GRID.y + ROWS * DRAM_CELL + 6} text="Color Buffer" />
            <Label x={DRAM_SIDE.x} y={DRAM_SIDE.y} text="Vertex Data" size={18} />
            <Label x={DRAM_SIDE.x} y={DRAM_SIDE.y + 60} text="Primitive List" size={18} />
            <Stat x={STAT_COL1} y={DRAM.y + 18} label="Fragment Shader 次數" value={shaded} color="white" size={44} />
            <Stat x={STAT_COL1} y={DRAM.y + 118} label="Framebuffer Access" value={stored} color={COLOR.good} size={60} note="只有 Color Store" />
            <Stat
                x={STAT_COL2}
                y={DRAM.y + 18}
                label="Vertex Data 寫/讀"
                value={`${vertexWrite} / ${listRead * VERTS}`}
                color={COLOR.geo}
                size={40}
            />
            <Stat x={STAT_COL2} y={DRAM.y + 118} label="Primitive List 寫/讀" value={`${listWrite} / ${listRead}`} color={COLOR.geo} size={40} />

            <FullSvg>
                {/* 左：螢幕空間（Rasterize 進度） */}
                <Cells ox={SCREEN.x} oy={SCREEN.y} cell={PX} cols={COLS} rows={ROWS} colorAt={screenColor} />
                {triStarts.map((s, i) =>
                    s <= frame ? (
                        <TriOutline
                            key={TRIANGLES[i].label}
                            index={i}
                            progress={interpolate(frame, [s, s + OUTLINE], [0, 1], CLAMP)}
                            opacity={inPhase1 && i === currentTri ? 1 : 0.35}
                        />
                    ) : null,
                )}
                {jobs.map((j) => {
                    const [ox, oy] = tileOrigin(j.tile);
                    return <rect key={`grid-${j.tile}`} x={ox} y={oy} width={TILE_PX} height={TILE_PX} fill="none" stroke="#6b7895" strokeWidth={3} />;
                })}
                {badges.map((b) => {
                    if (b.at > frame) {
                        return null;
                    }
                    const [ox, oy] = tileOrigin(b.tile);
                    const flash = interpolate(frame - b.at, [0, 12], [0.3, 0], CLAMP);
                    const scale = interpolate(frame, [b.at, b.at + 8], [0, 1], { ...CLAMP, easing: Easing.out(Easing.back(1.7)) });
                    const bx = ox + 2 + b.slot * 34.5;
                    const by = oy + 3;
                    const isCurrent = active.some((j) => j.tile === b.tile);
                    return (
                        <g key={`b-${b.tri}-${b.tile}`} opacity={done(b.tile) ? 0.2 : 1}>
                            {flash > 0 ? <rect x={ox} y={oy} width={TILE_PX} height={TILE_PX} fill={COLOR.accent} opacity={flash} /> : null}
                            <g transform={`translate(${bx + 16.5} ${by + 15}) scale(${scale}) translate(-16.5 -15)`}>
                                <rect
                                    width={33}
                                    height={30}
                                    rx={5}
                                    fill={TRIANGLES[b.tri].color}
                                    stroke={isCurrent ? COLOR.accent : "rgba(255,255,255,0.4)"}
                                    strokeWidth={isCurrent ? 2.5 : 1}
                                />
                                <text x={16.5} y={22} fontSize={20} fontWeight={700} fill="white" textAnchor="middle" fontFamily="Helvetica, Arial">
                                    {TRIANGLES[b.tri].label}
                                </text>
                            </g>
                        </g>
                    );
                })}

                {/* 處理中的 Tile：外框 + Core 標籤 + 連到 Tile Memory 的虛線 */}
                {active.map((j) => {
                    const [ox, oy] = tileOrigin(j.tile);
                    const to = memOrigin(j);
                    const fade = interpolate(frame, [j.start, j.start + 6], [0, 1], CLAMP) * (j.slow ? detailOpacity : fastOpacity);
                    return (
                        <g key={`active-${j.tile}`}>
                            <line
                                x1={ox + TILE_PX / 2}
                                y1={oy + TILE_PX / 2}
                                x2={to.x - 8}
                                y2={to.y + (TILE * memCell(j)) / 2}
                                stroke={COLOR.accent}
                                strokeWidth={3}
                                strokeDasharray="10 8"
                                strokeDashoffset={-frame * 1.5}
                                opacity={0.7 * fade}
                            />
                            <rect x={ox} y={oy} width={TILE_PX} height={TILE_PX} fill="none" stroke={COLOR.accent} strokeWidth={6} />
                            <rect x={ox + TILE_PX - 48} y={oy + TILE_PX - 36} width={44} height={32} rx={6} fill={COLOR.accent} />
                            <text x={ox + TILE_PX - 26} y={oy + TILE_PX - 13} fontSize={20} fontWeight={700} fill="#111" textAnchor="middle" fontFamily="Helvetica, Arial">
                                C{j.core}
                            </text>
                        </g>
                    );
                })}

                {/* GPU：Tile Memory */}
                <g opacity={detailOpacity}>
                    <TileMem job={slowJob} frame={frame} color={DET_COLOR} depth={DET_DEPTH} cell={DET_CELL} />
                </g>
                <g opacity={fastOpacity}>
                    {Array.from({ length: CORES }, (_, c) => {
                        const o = slotOrigin(c);
                        return (
                            <TileMem
                                key={`mem-${c}`}
                                job={active.find((j) => !j.slow && j.core === c)}
                                frame={frame}
                                color={o}
                                depth={{ x: o.x + 106, y: o.y }}
                                cell={SLOT_CELL}
                            />
                        );
                    })}
                </g>

                {/* DRAM：Color Buffer + Geometry */}
                <Cells ox={DRAM_GRID.x} oy={DRAM_GRID.y} cell={DRAM_CELL} cols={COLS} rows={ROWS} colorAt={dramColor} />
                {vertexChips.map((c, i) =>
                    c.at <= frame ? (
                        <rect
                            key={`v-${i}`}
                            x={DRAM_SIDE.x + (i % CHIPS_PER_ROW) * CHIP_PITCH}
                            y={VERTEX_CHIPS_Y + Math.floor(i / CHIPS_PER_ROW) * CHIP_PITCH}
                            width={CHIP}
                            height={CHIP}
                            rx={2}
                            fill={TRIANGLES[c.tri].color}
                            stroke={readingTris.has(c.tri) ? "white" : "none"}
                            strokeWidth={2}
                            opacity={interpolate(frame, [c.at, c.at + 6], [0, 1], CLAMP)}
                        />
                    ) : null,
                )}
                {badges.map((b) =>
                    b.at <= frame ? (
                        <rect
                            key={`l-${b.chip}`}
                            x={DRAM_SIDE.x + (b.chip % CHIPS_PER_ROW) * CHIP_PITCH}
                            y={LIST_CHIPS_Y + Math.floor(b.chip / CHIPS_PER_ROW) * CHIP_PITCH}
                            width={CHIP}
                            height={CHIP}
                            rx={2}
                            fill={TRIANGLES[b.tri].color}
                            stroke={readingChips.has(b.chip) ? "white" : "none"}
                            strokeWidth={2}
                            opacity={interpolate(frame, [b.at, b.at + 6], [0, 1], CLAMP)}
                        />
                    ) : null,
                )}

                {reading.map((j) => (
                    <ReadFlight key={`read-${j.tile}`} job={j} frame={frame} />
                ))}
                {storing.map((j) => (
                    <StoreFlight key={`store-${j.tile}`} job={j} frame={frame} />
                ))}
            </FullSvg>

            <Caption
                cues={[
                    { from: 0, text: "Phase 1 · Binning：先算出所有三角形的位置，記錄每個 Tile 會被哪些三角形影響" },
                    { from: binEnd, text: "Phase 2 必須等這個 Render Pass 的 Binning 全部完成，每個 Tile 的清單才完整" },
                    { from: p2Start - 10, text: "Phase 2 · 先看一個 Core：讀回清單，依提交順序只畫清單裡的三角形，Color / Depth 都留在 On-chip" },
                    { from: jobs[0].end, text: "Tile 完成時只把 Color 寫回 DRAM，Depth 直接丟棄（DONT_CARE，不寫回）" },
                    { from: fastStart - 15, text: "實際上多個 Shader Core 同時處理不同 Tile：Tile 之間互不相依，處理順序不影響結果" },
                    {
                        from: end,
                        text: "TBR 本身不減少 Fragment 數量（不透明物件的 Overdraw 要靠 HSR / FPK 另外處理）；省下 Framebuffer 的 DRAM 流量，代價是 Geometry 讀寫",
                    },
                ]}
            />
            <Footnote text="概念示意 · 16×12 Pixels、Tile 4×4、4 個 Core · 計數為簡化單位，Geometry 存法依 GPU 而異 · 忽略 Cache / Compression / HSR" />
        </Stage>
    );
};
