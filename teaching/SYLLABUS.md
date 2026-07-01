# SYLLABUS — 圖學渲染入門(核心管線 9 課)

> **大前提**:以 **OpenGL / OpenGL ES** 核心繪圖 API 講解(clip space [-1,1]、GLSL)。Cocos 只在需要時作「對應到你引擎」的補充,不是主軸。
> **主軸**:跟著管線走(路 1)。自學、零圖學背景。
> **設計原則**:見 [NOTES.md](NOTES.md)「核心教學原則」— 輕量、體驗導向、數學絕不當關卡。

## 核心課程(9 課)

### A. 管線地圖
1. **渲染 + 管線** — 渲染在做什麼(輸入→輸出)、Mesh=三角形、固定 vs 可程式化管線、兩個 shader 位在哪。輕量定位課。
   來源:遊戲繪圖_00 電腦圖學、遊戲繪圖_01 GPU繪圖管線

### B. 輸入資料 + 空間直覺
2. **Mesh / 頂點資料** — 頂點、屬性,什麼餵進管線。
   來源:遊戲繪圖_03 Mesh
3. **座標空間 — 直覺篇** — 5 個空間、Model / View / Projection 各自*做了什麼*(視覺化)。數學 = 可選參考,不內嵌。
   來源:遊戲數學_02 座標空間(直覺);矩陣細節 → 可選 `reference/matrices.html`(遊戲數學_00 / 01 / 03 / 04)

### C. 可程式化階段 + 上色
4. **Vertex Shader** — `gl_Position = MVP * pos`,你會動到什麼。
   來源:遊戲繪圖_02 Shader(vertex 部分)
5. **Rasterization(+ clipping / culling)** — 三角形 → 片段、內插;範圍外剔除。
   來源:遊戲繪圖_00(光柵化段)、遊戲繪圖_07 Culling&Clipping
6. **Fragment Shader** — 逐片段上色、內插輸入。
   來源:遊戲繪圖_02 Shader(fragment 部分)
7. **Texture + UV + 取樣** — 貼圖、UV、filtering / wrap / mipmap。
   來源:遊戲繪圖_04 Texture
8. **Lighting** — diffuse / specular(在 fragment shader 裡)。
   來源:遊戲繪圖_06 Lighting
9. **Depth test + Blending** — 逐片段輸出運算:z-buffer、透明 / 疊色、繪製順序。
   來源:遊戲繪圖_10 Depth、遊戲繪圖_05 Blending

## 延後(核心之後再開)
- **NormalMap**(遊戲繪圖_09)、**Shadow**(遊戲繪圖_08) — 進階表面 / 陰影。
- **四元數旋轉**(遊戲數學_05) — 動到旋轉 / 動畫程式碼才需要。

## 附加課程軌(核心完成後)
- **路 2 — 跟著程式碼走**:打開真實 shader / material 逐段拆解。
- **路 3 — 跟著 bug 走**:以症狀(全黑、貼圖爆掉、z-fighting、透明怪、物件消失)為單元。

## 可選參考文件(reference/)
- `matrices.html` — 向量 / 矩陣 / MVP 數學深入(給想鑽的人,非必修)。
- `glossary.html` — 名詞中英對照(每課教到的詞累積)。

---
*狀態:9 課大綱已定案(2026-07-01)。逐課製作 lesson 時,若哪課草稿偏重就拆回、count 可微調。*
