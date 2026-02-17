# 遊戲開發 - 繪圖剔除與裁剪 Culling & Clipping

世界中所有的物體無法盡收眼底，相機不可見的物體仍進行繪圖處理的話便會浪費效能。Graphics Pipeline 中剔除 (Culling) 與裁剪 (Clipping) 是優化渲染效能的重要技術，透過排除不可見或超出可視範圍的幾何體，減少不必要的繪圖計算。

## 剔除 Culling

繪圖剔除技術在繪圖管線早期階段排除不可見的幾何體，避免將這些物件送入 GPU 進行後續處理，大幅降低 GPU 繪圖工作負擔。

### 視錐剔除 Frustum Culling

![frustum culling](images/viewfrustum.png)

視錐剔除 (Frustum Culling) 是最基礎且重要的剔除技術，排除位於相機視錐 (View Frustum) 範圍外的物件。 View Frustum 定義相機的可視範圍，由 6 個平面 (Near、Far、Left、Right、Top、Bottom) 構成類三角錐體。Frustum Culling 演算法即判定繪圖對象幾何體是否位於 View Frustum 範圍內：

**步驟：**
1. **建構視錐 6 平面**：從 View-Projection Matrix 提取 Near、Far、Left、Right、Top、Bottom 6 個裁剪平面公式
2. **取得物件包圍體**：對每個物件取其包圍體 (Bounding Volume，常用 AABB | Bounding Sphere)
3. **逐平面測試**：Bounding Volume 與 6 個平面逐一做半空間測試 (Half-Space Test)

   ```math
   \begin{aligned}
   &\textbf{Half-Space Test：} D = \mathbf{P} \cdot \mathbf{N} + d \\
   &\quad \bullet \ D > 0 \implies \text{內側 (可見)} \\
   &\quad \bullet \ D < 0 \implies \text{外側 (不可見)} \\
   &\quad \bullet \ D = 0 \implies \text{平面上} \\
   \\
   &\textbf{Bounding Sphere Culling：} \\
   &\quad \text{If } D_{center} < -Radius \implies \text{完全位於平面外側 (剔除)} \\
   \\
   &\textbf{Result：} \\
   &\quad \text{完全內部 } | \text{ 有交集} \implies \text{Keep (送入繪圖管線)} \\
   &\quad \text{完全外部} \implies \text{Cull (直接剔除)}
   \end{aligned}
   ```

Frustum Culling 處理在 CPU 端執行，屬 Graphics Pipeline 之應用階段 (Application Stage) 完成。

### 背面剔除 Back Face Culling

![back face culling](images/faceculling_frontback.png)

背面剔除 (Back Face Culling) 排除背對相機的三角形面。不透明物體之背面不可見故無需繪製；透明物體情況則不適用。Back Face Culling 屬於 Graphics Fixed Function Pipeline 的功能，GPU 硬體直接支援，開發者透過 Graphics API 啟用剔除並定義正面的頂點繞序 (Winding Order)：順時針或逆時針。

```c
// Back Face Culling 在 Vertex Shader 執行之後的 Primitive Assembly 階段執行(先頂點變換才座標空間後決定螢幕空間的三角形面向)
glEnable(GL_CULL_FACE); // 啟用背面剔除
glFrontFace(GL_CCW); // (OpenGL 預設)逆時針繞序為正面；CCW = Counter Clock Wise；CW = Clock Wise；
glCullFace(GL_BACK); // 剔除背面 (也可指定 GL_FRONT)
```

## 裁剪 Clipping

經 Frustum Culling 篩選的物件進入 GPU (開始 Graphics Pipeline 繪圖流程)後，可能僅部分位於視錐體內。此時 GPU 硬體會自動執行裁剪 (Clipping)，對部分超出範圍的三角形進行切割與重組 (產生新重組後的三角形)，確保只有位於視錐體內的幾何區域進入後續 Rasterization 階段。

### 視錐剪裁 View Frustum Clipping

![clipping](images/clipping_guardband.jpg)

GPU Graphics Pipeline 流程中當 Vertex Shader 處理完將頂點轉換至 Clip Space (正規化座標)後，GPU 硬體會執行幾何裁剪，確保後續光柵化階段只處理位於視錐體內的圖元。

現代 GPU 處理機制：

1.  **Near Plane Clipping (必要幾何處理)**：
    這是必須執行的步驟。針對穿過 Near Plane 的圖元進行真正的幾何切割與重組 (Retriangulation)。
    *   **目的**：防止頂點位於相機後方導致發生透視除法 ($/w$) 出現除以零之數值錯誤。
    *   **結果**：生成新的頂點與三角形，確保所有頂點 $w > 0$。

2.  **Guard Band Clipping (效能優化)**：
    對於 Left、Right、Top、Bottom 邊界，只要三角形未超出硬體設定的「Guard Band」範圍 (通常遠大於視錐體)，GPU 會保留完整三角形進入 Rasterization 階段，超出視窗的部分由 Rasterizer 自動捨棄。如此能大幅減少幾何切割運算的昂貴效能開銷。

**Clip Space 判定條件：**

```math
\begin{aligned}
&-w \leq x \leq w \\
&-w \leq y \leq w \\
&0 \leq z \leq w \quad \text{(DirectX | Vulkan | Metal)} \\
&-w \leq z \leq w \quad \text{(OpenGL)}
\end{aligned}
```

### 視口裁剪 Viewport Clipping

Rasterization 階段將 Clip Space 座標經轉換映射至螢幕座標 (Screen Coordinate) 後：

*   GPU 檢查 Fragment 是否位於 Viewport 或 Scissor Rect 矩形範圍內。於範圍外的 Fragment 會被直接丟棄 (Discard)。

1. **應用階段 (Application)**：視錐剔除、遮擋剔除
2. **幾何處理階段 (Geometry Processing)**：背面剔除
3. **光柵化階段 (Rasterization)**：視錐裁剪、視口裁剪、屏幕裁剪

## 效能優化

針對繪圖剔除，開發者提出更進階的遮擋剔除技術 (Occlusion Culling)，找到 View Frustum 範圍內但不看見的繪圖對象物體，進一步排除減少更多繪圖工作，後續再另外詳細介紹。

Culling & Clipping 技術是遊戲渲染效能優化的核心：

- **減少 Draw Call**：Frustum Culling 剔除不可見物件，降低 Draw Calls。
- **減少頂點處理**：Back Face Culling 與 Clipping 避免處理不可見幾何體，節省 Vertex Shader 與幾何運算量。
- **減少光柵化與片段處理**：Clipping 與 Viewport Clipping 避免對不可見區域進行 Rasterization，大幅節省 Fragment 像素處理。
- **降低記憶體頻寬**：減少不必要的頂點資料存取與 Frame Buffer 寫入（頻寬消耗）。

# 參考延伸閱讀

[Face culling](https://learnopengl.com/Advanced-OpenGL/Face-culling)

[Clipping](https://en.wikipedia.org/wiki/Clipping_(computer_graphics))

[Trip Through the Graphics Pipeline 2011, part 5](https://fgiesen.wordpress.com/2011/07/05/a-trip-through-the-graphics-pipeline-2011-part-5/)

[Guard Band Clipping](https://www.khronos.org/opengl/wiki/Guard_Band)

[WebGPU Pipeline](https://shi-yan.github.io/webgpuunleashed/Introduction/the_gpu_pipeline.html)
