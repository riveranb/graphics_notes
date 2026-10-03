export type Vec2 = readonly [number, number];

export type Tri = {
    readonly label: string;
    readonly color: string;
    readonly z: number; // 0 = 最近，1 = 最遠（Depth Buffer 清除值）
    readonly v: readonly [Vec2, Vec2, Vec2];
};

export type Frag = {
    readonly x: number;
    readonly y: number;
    readonly tri: number;
};

// 示意用的小螢幕：16x12 Pixels，Tile = 4x4 Pixels
export const COLS = 16;
export const ROWS = 12;
export const TILE = 4;
export const TILE_COLS = COLS / TILE;
export const TILE_ROWS = ROWS / TILE;
export const TILE_COUNT = TILE_COLS * TILE_ROWS;

// 提交順序 = 陣列順序，後畫的比較近（Depth Test 全部通過 → 最大 Overdraw）。Q1/Q2 是全螢幕背景 Quad
// 三角形顏色避開已有語意的 orange（DRAM）/ teal（On-chip）/ 黃（強調）/ 紫（Geometry）
export const TRIANGLES: readonly Tri[] = [
    { label: "Q1", color: "#4a5672", z: 0.9, v: [[0, 0], [16, 0], [0, 12]] },
    { label: "Q2", color: "#4a5672", z: 0.9, v: [[16, 0], [16, 12], [0, 12]] },
    { label: "A", color: "#4f8ef7", z: 0.6, v: [[1, 1], [11, 2], [3, 11]] },
    { label: "B", color: "#ec4899", z: 0.4, v: [[6, 3], [15, 5], [9, 11.5]] },
    { label: "C", color: "#84cc16", z: 0.2, v: [[10, 0.5], [14.5, 2.5], [11, 6]] },
];

const edge = (a: Vec2, b: Vec2, px: number, py: number): number => {
    return (b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0]);
};

// 以 Pixel 中心點做 Edge Function 測試（兩種 Winding 都接受）
const covers = (t: Tri, x: number, y: number): boolean => {
    const px = x + 0.5;
    const py = y + 0.5;
    const [a, b, c] = t.v;
    const e0 = edge(a, b, px, py);
    const e1 = edge(b, c, px, py);
    const e2 = edge(c, a, px, py);
    return (e0 >= 0 && e1 >= 0 && e2 >= 0) || (e0 <= 0 && e1 <= 0 && e2 <= 0);
};

export const tileOf = (x: number, y: number): number => {
    return Math.floor(y / TILE) * TILE_COLS + Math.floor(x / TILE);
};

// Scanline 順序產生 Fragments
export const fragmentsOf = (tri: number): Frag[] => {
    const out: Frag[] = [];
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (covers(TRIANGLES[tri], x, y)) {
                out.push({ x, y, tri });
            }
        }
    }
    return out;
};

// Binning：每個 Tile 的 Primitive List（保持提交順序）
// ponytail: 用實際覆蓋判斷，真實硬體多用 Bounding Box / 保守測試，清單可能更長
export const BINS: readonly (readonly number[])[] = Array.from({ length: TILE_COUNT }, (_, k) => {
    return TRIANGLES.map((_t, i) => i).filter((i) => fragmentsOf(i).some((f) => tileOf(f.x, f.y) === k));
});

// 某個 Tile 內的 Fragments：依 Primitive List 順序（= 提交順序）
export const tileFragments = (k: number): Frag[] => {
    return BINS[k].flatMap((i) => fragmentsOf(i).filter((f) => tileOf(f.x, f.y) === k));
};
