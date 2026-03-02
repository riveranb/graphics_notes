# 遊戲開發 - 動態陰影 Real Time Shadow

陰影 (Shadow) 是提升 3D 場景空間感、物體相對位置與場景真實度的關鍵。在目前的即時渲染 (Real-time Rendering) 中，最實用且廣泛應用的核心技術為 **Shadow Map**。

## 早期主流技術：Shadow Volume (陰影體)

在 Shadow Mapping 成為主流之前，Shadow Volume 是基於幾何度量（Object Space）的陰影技法，以「Stencil Shadow」演算法為代表（如早期《毀滅戰士 3》）。

核心概念：將遮擋物 (Occluder) 的輪廓延展形成封閉的 3D「陰影體」，再利用 Stencil Buffer 判斷片段 (Fragment) 是否在陰影體內部——若在內部即為陰影。

### 硬體與管線狀態 (Hardware/Pipeline Context)

*   **Geometry Extrusion (輪廓延展)**: 在 CPU 端計算輪廓，或在 **Geometry Shader** 中將邊緣頂點沿光線方向延伸，產生陰影體網格。
*   **Stencil Routing (模板渲染)**: 在 **Output Merger** 階段，關閉 Color Write 與 Depth Write（保留 Depth Test）。對陰影體正面 / 背面分別 Rasterize，依 Depth Test 結果遞增 / 遞減 Stencil Buffer。
*   **Lighting Pass**: 渲染時檢查 Stencil Buffer，值 > 0 表示片段在陰影體內，不給予光照。

### 優缺點與效能特性

*   **優點**：幾何精確度 (Pixel-perfect)，**完全沒有 Aliasing**。
*   **缺點 (Bandwidth / Fill-rate 殺手)**：
    *   陰影體覆蓋範圍極大，Rasterizer 大量 Overdraw，極度消耗 Stencil Buffer 頻寬。
    *   CPU 輪廓計算昂貴；Geometry Shader 方案管線效率不穩定。
    *   難以實現 Soft Shadow。

由於極端消耗 Fill-rate 且難以實現柔和邊緣，Shadow Volume 已逐漸被 Shadow Mapping 所取代。

## Shadow Mapping (陰影貼圖)

Shadow Map 是基於影像空間 (Image-space) 的技術，核心概念：「**片段若不在光源可視範圍內，則處於陰影中**」。

演算法包含兩個 Pass：
1.  **Shadow Pass**：以光源為攝影機渲染場景，將深度輸出至深度紋理 (Shadow Map)。
2.  **Lighting Pass**：在正常攝影機視角，將片段世界座標轉換至光源空間，比較當前深度與 Shadow Map 紀錄的深度——若當前深度較大，表示被遮擋，處於陰影中。

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

基礎 Shadow Map 受限於深度紋理解析度，邊緣會有嚴重 Aliasing。PCF 在 **Fragment Shader** 中對目標座標鄰近 Texels 多次採樣比較，平均測試結果。注意：PCF 模糊的是陰影測試結果，而非深度貼圖本身。這是實現 Soft Shadow 最常見的做法。

### Cascaded Shadow Maps (CSM)

針對大型場景，近處需要高精度陰影、遠處則不需要，單一 Shadow Map 會導致嚴重 Perspective Aliasing。CSM 在 **CPU** 端將相機 View Frustum 沿 $Z$ 軸切割為多個 Cascades，每層各自渲染不同範圍的 Shadow Map。

*   **Pipeline Context**: CPU 端進行 Frustum 分割與剔除，Shadow Pass 的 Draw Call 數量隨 Cascade 數倍增。Fragment Shader 依片段深度選擇對應層級的 Shadow Map。

### Variance Shadow Maps (VSM)

PCF 無法利用硬體 Mipmap / Bilinear Filtering。VSM 將深度 $d$ 與 $d^2$ 寫入紋理，透過 Chebyshev's inequality 估算陰影機率。
*   **Pipeline Context**: Shadow Map 可直接套用 Gaussian Blur 等過濾，享有硬體採樣加速優勢。

## 效能優化 (Performance & Optimization)

*   **Frustum Culling**: 每次 Shadow Pass Draw Call 都增加 GPU Command Processor 負擔，務必用光源視錐做好 Culling。
*   **Shadow Proxy**: Shadow Pass 僅需深度，可用 Low-poly LOD 網格取代，減少 Vertex Shader ALU 與 Bandwidth。
*   **關閉 Color Write**: Shadow Pass 不需顏色輸出，關閉可大幅省頻寬。
*   **Front-Face Culling**: 僅渲染物體背面寫入深度，利用幾何厚度自然解決大部分 Shadow Acne，免調 Depth Bias。
*   **Early-Z 利用**: Shadow Pass 安排在 Opaque Pass 之前，讓主 Pass 最大化 Early-Z 剔除。

### 參考延伸閱讀

*   Real-Time Rendering 4th Edition - Chapter 7: Shadows
*   LearnOpenGL: Shadow Mapping & CSM
*   Cascaded Shadow Maps (Microsoft DirectX Documentation)
