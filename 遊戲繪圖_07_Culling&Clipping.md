# 遊戲開發 - 繪圖剔除與裁剪 Culling & Clipping

世界中所有的物體無法盡收眼底，故相機的視野可見範圍亦是有限的。相機不可見的物體仍進行繪圖處理的話便成了浪費效能的負擔。剔除 (Culling) 與裁剪 (Clipping) 是優化渲染效能的重要技術，透過排除不可見或超出可視範圍的幾何體，減少不必要的繪圖計算。

## 剔除 Culling

繪圖剔除技術在繪圖管線早期階段排除不可見的幾何體，避免將這些物件送入 GPU 進行後續處理，大幅降低 GPU 繪圖工作負擔。

### 視錐剔除 Frustum Culling

![frustum culling](images/viewfrustum.png)

視錐剔除 (Frustum Culling) 是最基礎且重要的剔除技術，排除位於相機視錐 (View Frustum) 範圍外的物件。 View Frustum 定義相機的可視範圍，由 Near Plane (最近可視平面)、Far Plane (最遠可視平面) 與 4 個側面平面構成之錐狀體範圍。

視錐剔除通常在 CPU 端執行，屬 Graphics Pipeline 之應用階段 (Application Stage) 完成。

### 背面剔除 Back Face Culling

![back face culling]

背面剔除 (Back Face Culling) 排除背對相機的三角形面。不透明物體之背面不可見故無需繪製；透明物體則不適用。Back Face Culling 屬於 Graphics Fixed-Function Pipeline 的功能，GPU 硬體直接支援，開發者透過 Graphics API 啟用剔除並定義正面的頂點繞序 (Winding Order)：順時針 (Clockwise) 或逆時針 (Counter-Clockwise)。

```c
glEnable(GL_CULL_FACE); // 啟用背面剔除
glFrontFace(GL_CCW); // 定義逆時針繞序為正面 (OpenGL 預設)
glCullFace(GL_BACK); // 剔除背面 (也可指定 GL_FRONT)
```

與 Frustum Culling 不同，Back Face Culling 在 Vertex Shader 執行之後的 Primitive Assembly 階段執行(先完成頂點變換才能判定螢幕空間中的三角形朝向)。因此 Back Face Culling 節省的是後續的光柵化 (Rasterization) 與 Fragment Shader 運算。

## 裁剪 Clipping

裁剪 (Clipping) 處理部分位於視圖範圍內的幾何體，將超出範圍的部分切除，只保留可見區域進行後續渲染。

### 視錐裁剪 View Frustum Clipping

![clipping]

視錐裁剪在投影轉換後執行，將位於 Clip Space 範圍外的頂點與三角形進行裁剪。Clip Space 定義為正規化座標範圍 [-1, -1, -1] ~ [1, 1, 1] 的立方體空間。

**裁剪平面：**

```math
\begin{aligned}
&\text{Clip Space 裁剪條件：} \\
&-w \leq x \leq w \\
&-w \leq y \leq w \\
&-w \leq z \leq w \\
&\text{其中 } w \text{ 為齊次座標的 } w \text{ 分量}
\end{aligned}
```

**Sutherland-Hodgman 裁剪算法：**

經典的多邊形裁剪算法，依序對每個裁剪平面進行裁剪操作。

```glsl
// GPU 硬體自動執行裁剪，Vertex Shader 輸出 gl_Position 後
// GPU 會自動處理超出 Clip Space 的圖元
void main() {
    // 計算 Clip Space 座標
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    // GPU 自動裁剪超出範圍的部分
}
```

### 視口裁剪 Viewport Clipping

視口裁剪將 Clip Space 座標轉換到屏幕座標時，自動排除超出視口 (Viewport) 範圍的像素。視口定義實際繪圖的屏幕區域。

## 剔除與裁剪的執行時機

![pipeline culling clipping]

GPU 繪圖管線中，剔除與裁剪在不同階段執行：

1. **應用階段 (Application)**：視錐剔除、遮擋剔除
2. **幾何處理階段 (Geometry Processing)**：背面剔除
3. **光柵化階段 (Rasterization)**：視錐裁剪、視口裁剪、屏幕裁剪

## 效能優化

剔除與裁剪技術是遊戲渲染效能優化的核心：

- **減少 Draw Call**：剔除不可見物件，降低 CPU 端繪圖指令提交
- **減少頂點處理**：避免處理不可見幾何體的頂點著色器運算
- **減少片段處理**：避免處理不可見像素的片段著色器運算
- **降低記憶體頻寬**：減少不必要的資料傳輸

現代遊戲引擎會結合多種剔除技術，在 CPU 與 GPU 端協同工作，最大化渲染效能。

# 參考延伸閱讀
