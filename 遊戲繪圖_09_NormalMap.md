# 遊戲開發 - 法線貼圖 Normal Mapping

在 3D 繪圖中，物體表面的光影細節（如凹凸、皺褶、裂縫）能大幅提升真實感。然而，要用幾何頂點（Vertices）來呈現這些細節，會需要極高的多邊形面數（High Poly），這對即時渲染（Real-time Rendering）的效能是一大負擔。

**法線貼圖 (Normal Mapping)** 提供了一個兩全其美的解決方案：我們使用低面數（Low Poly）的模型來確保效能，同時利用一張特殊的紋理貼圖來「欺騙」光照系統，讓模型表面看起來擁有高面數的光影細節。

## 法線貼圖的基本概念

在標準的光照計算中，表面的法線向量（Normal Vector）決定了光線如何反射。如果模型只有一個平面的法線，光照結果就會看起來非常平坦。

法線貼圖的核心思想是：**將逐頂點（Per-vertex）的法線，替換為逐片段（Per-fragment）的法線。**
我們將每個像素位置的法線向量 $(X, Y, Z)$ 轉換為 $(R, G, B)$ 顏色值，儲存在一張 2D 紋理貼圖中。

*   **為什麼法線貼圖看起來是偏藍紫色的？**
    法線向量的範圍是 $[-1, 1]$，存入圖片時會被映射到 $[0, 1]$。大多數情況下，表面的法線是垂直向外的，也就是指向正 Z 軸 $(0, 0, 1)$。經過映射後，這個向量變成 $(0.5, 0.5, 1.0)$，在 RGB 色彩空間中呈現的就是一種偏藍紫色的視覺效果。

## 切線空間 (Tangent Space)

如果法線貼圖直接記錄「世界座標」下的法線方向，會遇到一個致命問題：**當模型旋轉時，貼圖裡的法線方向就不正確了**。

為了解決這個問題，法線貼圖內的法線向量是定義在一個相對於模型表面的局部座標系中，稱為**切線空間 (Tangent Space)**。在這個空間裡，無論表面如何傾斜或旋轉，法線（Normal）永遠指向正 Z 軸。

構成切線空間需要三個互相垂直的基底向量，合稱為 **TBN 矩陣**：
1.  **N (Normal)**：垂直於表面的法線。
2.  **T (Tangent)**：平行於表面，且對應紋理 UV 座標的 U 方向（水平）。
3.  **B (Bitangent)**：平行於表面，且對應紋理 UV 座標的 V 方向（垂直）。

## 切線與副切線的計算原理

法線 (N) 通常由 3D 建模軟體提供，但切線 (T) 和副切線 (B) 該如何獲得？

由於 T 和 B 的方向與紋理座標 (UV) 貼齊，我們可以利用三角形的頂點座標差（Edges）與 UV 座標差 ($\Delta U, \Delta V$) 之間的線性關係來推導：

```math
\begin{aligned}
Edge_1 &= \Delta U_1 \cdot T + \Delta V_1 \cdot B \\
Edge_2 &= \Delta U_2 \cdot T + \Delta V_2 \cdot B
\end{aligned}
```
透過解這個線性方程式，我們就能計算出每個三角形表面的 T 和 B 向量。在現代遊戲引擎中，這些資料通常會在模型載入階段預先計算好，並作為頂點屬性（Vertex Attributes）傳入 GPU。

*   **實務優化：省去 Bitangent 頂點屬性**
    因為 T、B、N 三者互相垂直，實務上為了節省頂點暫存區 (VBO) 的記憶體與頻寬，我們**不會**把副切線 (B) 當作屬性傳給 GPU，而是在 Vertex Shader 內直接靠向量外積（Cross Product）算出來。此外，為了支援對稱模型共用貼圖（UV 鏡像），通常會在 Tangent 的 $W$ 分量夾帶旋轉方向（$+1.0$ 或 $-1.0$）：
    ```glsl
    vec3 B = cross(N, T) * aTangent.w; // 靠外積導出 B，W 分量處理 UV 鏡像
    ```

## Shader 實作邏輯

在渲染管線中實作 Normal Mapping，通常會有兩種空間轉換的選擇：
1.  將法線從「切線空間」轉換到「世界空間」。
2.  將光源方向與視角方向從「世界空間」轉換到「切線空間」。

**實務上推薦的做法是第二種**。因為我們可以在 Vertex Shader 中就將光源和視角向量轉換到切線空間，這樣 Fragment Shader 只需要單純進行內積運算即可，能大幅節省計算效能（因為 Vertex 數量遠少於 Fragment 數量）。

### Vertex Shader
在 Vertex Shader 中，由於模型共用頂點經平均化後 T 與 N 可能不完全互垂，建議先做一次 **Gram-Schmidt 正交化**，再利用轉置矩陣（正交矩陣的反矩陣即為轉置矩陣 `transpose`）將世界空間的向量轉換至切線空間：

```glsl
// 1. Gram-Schmidt 正交化：確保 T 與 N 完全垂直
T = normalize(T - dot(T, N) * N);
vec3 B = cross(N, T) * aTangent.w; // 靠外積算出 B，W 分量處理 UV 鏡像

// 2. 建立 TBN 矩陣，用轉置取代繁重的矩陣求逆
mat3 TBN = transpose(mat3(T, B, N));

// 3. 將光照與視角向量轉換至切線空間，傳遞給 Fragment Shader
TangentLightPos = TBN * lightPos;
TangentViewPos  = TBN * viewPos;
TangentFragPos  = TBN * vec3(model * vec4(aPos, 1.0));
```

### Fragment Shader
在 Fragment Shader 中，我們從法線貼圖採樣出顏色，將其還原為 $[-1, 1]$ 的法線向量，接著使用切線空間下的向量進行標準的漫反射（Diffuse）與高光（Specular）計算。

```glsl
// 1. 從貼圖採樣法線 (範圍 [0,1])
vec3 normal = texture(normalMap, TexCoords).rgb;

// 2. 將法線映射回 [-1,1]
normal = normalize(normal * 2.0 - 1.0);

// 3. 在切線空間中進行常規光照計算
vec3 lightDir = normalize(TangentLightPos - TangentFragPos);
float diff = max(dot(normal, lightDir), 0.0);
// ...後續可接續計算 Specular 等
```

## 實戰常見問題 (FAQ)

### 為什麼貼上去後，該凸出的地方反而凹下去？

這是遊戲業最經典的地雷：**綠色通道翻轉 (Flip Green Channel / Y+ vs Y-)**。
*   **OpenGL 系統**（含本篇範例）：法線貼圖的 Y 軸指向上方（**Y+**）。
*   **DirectX / Unreal Engine**：Y 軸指向下方（**Y-**）。

若發現法線凹凸方向上下顛倒，只需在 Shader 讀取貼圖時將 $G$ 通道數值取負，或在建模軟體／引擎內勾選 **Flip Green**。

### 為什麼採樣後要對法線再次 `normalize()`？

即便貼圖存的時候是單位向量，經過雙線性過濾（Bilinear Filtering）或 Mipmapping 的內插計算後，法線長度往往會略小於 1。**採樣後的二次標準化不可省略**。

## 參考延伸閱讀

[LearnOpenGL - Normal Mapping](https://learnopengl.com/Advanced-Lighting/Normal-Mapping)

[OpenGL Tutorial - Tutorial 13 : Normal Mapping](https://www.opengl-tutorial.org/intermediate-tutorials/tutorial-13-normal-mapping/)
