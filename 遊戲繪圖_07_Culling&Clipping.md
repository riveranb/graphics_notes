# 遊戲開發 - 剔除與裁剪 Culling & Clipping

GPU 繪圖管線中，剔除 (Culling) 與裁剪 (Clipping) 是優化渲染效能的重要技術，透過排除不可見或超出視圖範圍的幾何體，減少不必要的繪圖計算。

## 剔除 Culling

剔除技術在繪圖管線早期階段排除不可見的幾何體，避免將這些物件送入 GPU 進行後續處理，大幅降低繪圖負擔。

### 視錐剔除 Frustum Culling

![frustum culling](images/frustum_culling.png)

視錐剔除 (Frustum Culling) 是最基礎且重要的剔除技術，排除位於相機視錐 (View Frustum) 範圍外的物件。視錐定義相機的可視範圍，由 Near Plane、Far Plane 與四個側面平面構成。

**視錐平面計算：**

```math
\begin{aligned}
&\text{視錐由 6 個平面定義：} \\
&\text{• Near Plane：} z = -near \\
&\text{• Far Plane：} z = -far \\
&\text{• Left/Right/Top/Bottom Planes：由投影矩陣決定}
\end{aligned}
```

**包圍盒測試 (Bounding Box Test)：**

遊戲引擎通常使用物件的包圍盒 (Bounding Box) 或包圍球 (Bounding Sphere) 與視錐進行相交測試，快速判斷物件是否在視錐內。

```typescript
// 簡化的視錐剔除邏輯
function isInFrustum(boundingBox: BoundingBox, frustum: Frustum): boolean {
    for (let plane of frustum.planes) {
        // 計算包圍盒在平面法向量方向上的投影
        const distance = plane.distanceToPoint(boundingBox.center);
        if (distance < -boundingBox.radius) {
            return false; // 完全在視錐外
        }
    }
    return true; // 可能與視錐相交
}
```

視錐剔除通常在 CPU 端執行，在應用階段 (Application Stage) 完成，避免將不可見物件送入 GPU 處理。

### 背面剔除 Back Face Culling

![back face culling](images/backface_culling.png)

背面剔除 (Back Face Culling) 排除背向相機的三角形面，因為這些面通常不可見（除非物體是透明的）。GPU 硬體支援高效的背面剔除，透過頂點順序 (Winding Order) 判斷三角形朝向。

**頂點順序：**

- **順時針 (Clockwise, CW)**：面向相機
- **逆時針 (Counter-Clockwise, CCW)**：背向相機

```glsl
// GPU 自動處理背面剔除，Shader 中無需額外代碼
// 透過 Graphics API 設定剔除模式
// OpenGL: glCullFace(GL_BACK) 或 glCullFace(GL_FRONT)
```

背面剔除在 GPU 幾何處理階段 (Geometry Processing) 執行，硬體自動處理，效能開銷極低。

### 遮擋剔除 Occlusion Culling

![occlusion culling](images/occlusion_culling.png)

遮擋剔除 (Occlusion Culling) 排除被其他物件完全遮擋的物件，即使這些物件位於視錐內。遮擋剔除計算成本較高，通常用於大型場景優化。

**常見實現方式：**

1. **Hierarchical Z-Buffer (HZB)**
   - 使用多層級深度緩衝區快速判斷遮擋關係

2. **Portal Culling**
   - 適用於室內場景，透過門窗等開口判斷可見區域

3. **PVS (Potentially Visible Set)**
   - 預先計算場景中每個區域的可見物件集合

## 裁剪 Clipping

裁剪 (Clipping) 處理部分位於視圖範圍內的幾何體，將超出範圍的部分切除，只保留可見區域進行後續渲染。

### 視錐裁剪 View Frustum Clipping

![clipping](images/clipping_frustum.png)

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

### 屏幕裁剪 Scissor Test

![scissor test](images/scissor_test.png)

屏幕裁剪 (Scissor Test) 限制繪圖區域到指定的矩形範圍，超出範圍的像素會被丟棄。常用於 UI 渲染、視窗分割等場景。

```glsl
// 透過 Graphics API 設定裁剪區域
// OpenGL: glScissor(x, y, width, height)
// 啟用: glEnable(GL_SCISSOR_TEST)
```

### 視口裁剪 Viewport Clipping

視口裁剪將 Clip Space 座標轉換到屏幕座標時，自動排除超出視口 (Viewport) 範圍的像素。視口定義實際繪圖的屏幕區域。

## 剔除與裁剪的執行時機

![pipeline culling clipping](images/pipeline_culling_clipping.png)

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

[Frustum Culling](https://learnopengl.com/Advanced-OpenGL/Frustum-culling)

[Back-face culling](https://en.wikipedia.org/wiki/Back-face_culling)

[Occlusion Culling](https://en.wikipedia.org/wiki/Occlusion_culling)

[Sutherland-Hodgman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm)

