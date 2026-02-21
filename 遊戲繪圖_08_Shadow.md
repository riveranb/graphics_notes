# 遊戲開發 - 動態陰影 Real Time Shadow

陰影 (Shadow) 是提升 3D 場景空間感、物體相對位置與場景真實度的關鍵。在目前的即時渲染 (Real-time Rendering) 中，最實用且廣泛應用的核心技術為 **Shadow Map**。

## 早期主流技術：Shadow Volume (陰影體)

在 Shadow Mapping 成為絕對主流之前，Shadow Volume 是一種基於幾何度量（Object Space）的陰影技法，以著名的「Stencil Shadow」演算法為代表（例如早期《毀滅戰士 3》大量使用此技術）。

其核心概念是：將遮擋物 (Occluder) 的輪廓延展，形成一個封閉的 3D 幾何空間——即「陰影體」。接著利用 Stencil Buffer（模板緩衝）來判斷場景中的片段 (Fragment) 是否位於這個陰影體內部。如果片段在陰影體內，就代表被遮擋，屬於陰影。

### 硬體與管線狀態 (Hardware/Pipeline Context)

*   **Geometry Extrusion (輪廓延展)**: 可以在 CPU 端計算物體的向光面與背光面輪廓，或者在 **Geometry Shader** 中動態將物體邊緣頂點沿著光線方向無限延伸，產生陰影體的幾何網格 (Mesh)。
*   **Stencil Routing (模板渲染)**: 在 **Output Merger** 階段，關閉 Color Target 的寫入，並且關閉 Depth Write（但保留 Depth Test）。對陰影體的正面 (Front-facing) 與背面 (Back-facing) 分別進行 Rasterization，根據 Depth Test 的結果來遞增或遞減 Stencil Buffer 的值。
*   **Lighting Pass**: 在最終渲染畫面時，檢查每個片段的 Stencil Buffer 值。若值大於 0，表示片段在陰影體內，不給予光照。

### 優缺點與效能特性

*   **優點 (完美精度)**：基於真實的幾何計算，因此具有像素等級的精確度 (Pixel-perfect)，**完全沒有走樣 (Aliasing) 與鋸齒問題**。
*   **缺點 (Bandwidth 與 Fill-rate 殺手)**：
    *   延展出來的陰影體可能會覆蓋畫面極大的範圍，導致在 Rasterizer 階段產生天文數字般的 Overdraw，並極度消耗 Stencil Buffer 的讀寫頻寬 (Bandwidth)。
    *   在 CPU 計算物件輪廓非常消耗運算資源，若依賴 Geometry Shader 則管線效率不穩定。
    *   無法輕易實現柔和陰影 (Soft Shadow)。

由於極端消耗 Fill-rate 且難以製作柔和邊緣，隨著硬體管線與機能的發展，Shadow Volume 逐漸被效能更穩定且彈性更大的 Shadow Mapping 所取代。

## Shadow Mapping (陰影貼圖)

Shadow Map 是一種基於影像空間 (Image-space) 的技術，其核心概念是「**如果目標片段 (Fragment) 被遮擋而不在光源的有效可視範圍內，則該片段處於陰影中**」。此算法通常包含兩個主要的渲染階段 (Pass)：首先，將虛擬攝影機放置在光源位置渲染場景，並將深度資訊輸出至一張深度紋理 (即 Shadow Map) 中；接著，在正常的攝影機視角渲染場景時，將每個片段 (Fragment) 的世界座標轉換至光源空間，並將算出的當前片段深度與 Shadow Map 中紀錄的深度進行比較。若當前片段的深度大於 Shadow Map 在該 UV 座標上的深度，表示光線被擋住，代表處於陰影之中。

![Shadow Mapping Concept](image_placeholder_shadow_map.png)

### 數學模型 (Mathematics)

從 World Space 到 Light Space 的轉換矩陣，結合了光照視角的 View Matrix 與 Projection Matrix：

```math
\begin{aligned}
P_{light\_clip} &= M_{light\_proj} \times M_{light\_view} \times P_{world\_pos} \\
P_{ndc} &= \frac{P_{light\_clip}.xyz}{P_{light\_clip}.w} \\
D_{current} &= P_{ndc}.z \times 0.5 + 0.5 \quad \text{(映射至 [0, 1] 範圍)}
\end{aligned}
```

### 硬體與管線狀態 (Hardware/Pipeline Context)

*   **Shadow Pass (Directional/Spot light)**: 在 Rasterizer 管線階段後，通常不接上複雜的 Fragment Shader，硬體可以僅將深度值寫入 Depth Buffer。
*   **Lighting Pass (Camera View)**: 在 Fragment Shader 中執行，對 Shadow Map 進行紋理採樣 (Texture Sampling)，並與經過矩陣轉換和透視除法計算出來的 $D_{current}$ 比較，決定陰影強度。

### 實作範例 (Implementation)

片段著色器 (Fragment Shader) 中的基礎 Shadow Map 判斷範例：

```glsl
float ShadowCalculation(vec4 fragPosLightSpace)
{
    // 透視除法 (Perspective Divide) 轉換為 NDC 座標
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    
    // 映射 Ndc 去適應深度紋理的 [0, 1] 範圍
    projCoords = projCoords * 0.5 + 0.5;
    
    // 防呆處理：若片段超出光錐範圍，預設不在陰影中
    if (projCoords.z > 1.0)
        return 0.0;
        
    // 採樣 Shadow Map 取得最靠近光源的深度
    float closestDepth = texture(shadowMap, projCoords.xy).r; 
    
    // 當前片段深度
    float currentDepth = projCoords.z;
    
    // 使用 Depth Bias 解決 Shadow Acne (陰影失真/莫黑紋)
    float bias = max(0.05 * (1.0 - dot(normal, lightDir)), 0.005);
    float shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;
    
    return shadow;
}
```

## 其他相關技術 (Related Technologies)

### Percentage-Closer Filtering (PCF)

基礎的 Shadow Map 受限於 Depth Texture 解析度，邊緣會有嚴重的走樣 (Aliasing，即鋸齒邊緣)。PCF 專注於 **Fragment Level**，在 Fragment Shader 對目標座標附近的幾個德克索 (Texels) 進行多次採樣與比較，並將通過測試的結果平均。它並不模糊深度貼圖本身，而是模糊陰影測試的結果，這是實現柔和陰影 (Soft Shadow) 最常見的做法。

### Cascaded Shadow Maps (CSM)

針對大型開放世界，攝影機近處需要極高解析度的陰影，遠處則較不需要，單一 Shadow Map 會導致嚴重的 Perspective Aliasing。CSM 在 **Object Level (CPU)** 根據相機視錐 (View Frustum) 沿著深度 $Z$ 軸切割成多個層級 (Cascades)，並為每個層級單獨渲染不同解析度與範圍的 Shadow Map。

*   **Pipeline Context**: 在 CPU 端進行 Frustum 分割與剔除，這使 Shadow Pass 的 Draw Call 數量顯著增加。在 Fragment Shader 中會根據當前片段與相機的深度距離，動態決定要讀取哪一層的 Shadow Map。

### Variance Shadow Maps (VSM)

傳統 PCF 的比較運算較慢且無法使用硬體的 Mipmap 或雙線性過濾 (Bilinear Filtering)。VSM 將深度 $d$ 與深度平方 $d^2$ 寫入紋理中，後續利用機率論中的切比雪夫不等式 (Chebyshev's inequality) 來估算片段在陰影中的機率。
*   **Pipeline Context**: 此作法讓 Shadow Map 可以直接被模糊化（如 Gaussian Blur 套用在紋理本身），在硬體採樣上享有過濾 (Filtering) 的效能優勢。

## 效能優化 (Performance & Optimization)

*   **嚴格的 Frustum Culling**: 在 CPU 每提交一次 Shadow Pass 的 Draw Call，都會加重 GPU 的 Command Processor 負擔並且佔用執行時間。務必在物件進入 Shadow Pass 之前，用光源視錐做好 Culling。
*   **Shadow Proxy 簡化幾何**: 在 Shadow Pass 中僅需深度，因此可以使用低多邊形 (Low-poly) LOD 版本網格替換高精細度的繪圖網格，減少 Vertex Shader ALU 計算與記憶體 Bandwidth。
*   **關閉 Color Write**: 在 Shadow Pass 中，不需要任何顏色輸出，關閉 Color Target 的寫入能大幅省下頻寬。
*   **Front-Face Culling**: 渲染 Shadow Map 時開啟 Front-face culling (僅渲染物體背面寫入深度)，可以利用幾何本身的厚度自然解決掉大部分的 Shadow Acne (陰影痤瘡) 問題，避免調校麻煩的 Depth Bias。
*   **Early-Z 利用**: 把 Shadow Pass 安排在 Opaque Pass 之前，並讓主 Opaque Pass 最大限度運用 Early-Z 剔除被遮擋的 Fragment Shader 運算。

### 參考延伸閱讀

*   Real-Time Rendering 4th Edition - Chapter 7: Shadows
*   LearnOpenGL: Shadow Mapping & CSM
*   Cascaded Shadow Maps (Microsoft DirectX Documentation)
