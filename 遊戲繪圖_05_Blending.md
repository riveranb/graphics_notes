# 遊戲開發 - GPU 顏色混合 Blending

Blending 位於 GPU Graphics Pipeline 處理中 Per-Fragment Operations 階段，混合新舊像素顏色，實現透明、發光等特效。

## 透明 Transparent

透明效果讓物體呈現半透明或完全透明狀態。在 Graphics Pipeline 中顏色的透明度透過 Alpha 通道控制。透明物體不能直接覆蓋背景，需要與後方像素進行顏色混合。常見透明混合顏色公式：

```math
\begin{aligned}
&C_{out} = C_{source} \times \alpha_{source} + C_{destination} \times (1 - \alpha_{source}) \\
\\
&\text{其中：} \\
&C_{source} : \text{新繪製來源像素顏色} \\
&C_{destination} : \text{Frame Buffer 中目標像素原有顏色} \\
&\alpha_{source} : \text{新來源像素的透明度值}
\end{aligned}
```

### 透明繪圖排序

透明繪圖顏色使用混合顏色公式計算得出，公式的前提是新的來源透明顏色與之前的透明顏色混合，因此繪製順序會直接影響顏色結果。透明度混合公式不具交換性質，A 混合 B 與 B 混合 A 會產生不同顏色。不透明物體繪圖依賴 Depth Buffer (Z-Buffer) 深度測試自動解決遮擋。透明物體繪圖則無法寫入深度，因為會錯誤地覆蓋後方物體繪製結果。

解決方案：**從後往前繪圖 (Back-to-Front)**

![transparency sorting](images/transparency_back2front_sorting.png)

關閉透明物體深度寫入，按物體到攝影機距離排序，依序先繪製較遠物體再繪製較近物體，確保混合順序正確，即能計算正確透明混色結果。遊戲引擎/繪圖引擎都會正確處理透明物件的由後至前方排序工作，但也伴隨著(CPU端)計算代價

### 透明透空 Alpha Test

![alpha test](images/transparency_alphatest.png)

透明透空繪圖 (Alpha Test) 是透明度處理的替代方案，透過設定透明度門檻值 (Threshold) 決定像素保留或丟棄，避免複雜的顏色混合運算。透明度低於門檻值(如 0.5)的像素會被 GPU 丟棄 (Discard)，高於門檻值則當作完全不透明繪圖處理(並寫入深度)。透明透空無法產生平滑的透明漸變效果，邊緣易出現鋸齒 (Aliasing) 現象，適合用於有明確透明邊界的材質，如植物葉片、鐵絲網、UI 圖示等，不適合玻璃、煙霧等需要漸變透明的效果。

## Blend 狀態

![Cocos BlendState](images/cocoscreator_blendstate.png)

GPU 透過「Blend 狀態參數」來控制來源像素 (Source) 與目標像素 (Destination) 的顏色混合方式。這些參數可使用 Graphics API 設置，下述主要以 OpenGL 為前提介紹：

- **Blend Enable (啟用混合)**  
  是否啟用顏色混合。若關閉，來源像素會直接覆蓋目標像素。

- **Blend Equation (混合方程式)**  
  決定來源與目標顏色如何組合。常見選項有：
  - `FUNC_ADD`：Source + Destination
  - `FUNC_SUBTRACT`：Source - Destination
  - `FUNC_REVERSE_SUBTRACT`：(反向相減) Destination - Source

- **Blend Factor (混合因子)**  
  控制來源與目標顏色在混合時的權重係數。常見因子有：
  - `ZERO`（0）
  - `ONE`（1）
  - `SRC_ALPHA`（Source_Alpha）
  - `ONE_MINUS_SRC_ALPHA`（1 - Source_Alpha）
  - `DST_ALPHA`（Destination_Alpha）
  - `ONE_MINUS_DST_ALPHA`（1 - Destination_Alpha）

- **Color Mask (顏色遮罩)**  
  控制哪些顏色通道（R/G/B/A）允許寫入 Frame Buffer。

- **Blend Color (混合常數顏色)**  
  某些混合模式下可指定一個常數顏色參與混合。

Graphics Pipeline 在 Fragment Shader 回傳顏色結果後，便以 Blend 狀態參數執行指定的混合公式，計算出最終顏色結果，該過程通用混合公式：

```math
\begin{align}
C_{out} &= C_{src} \times F_{src} \oplus C_{dst} \times F_{dst} \\
\\
\text{其中：} \\
C_{out} &: \text{最終寫入 Frame Buffer 的顏色向量 (R, G, B, A)} \\
C_{src} &: \text{來源顏色（Fragment Shader 輸出）} \\
C_{dst} &: \text{目標顏色（Frame Buffer 原有值）} \\
F_{src} &: \text{來源混合因子（Source Blend Factor）} \\
F_{dst} &: \text{目標混合因子（Destination Blend Factor）} \\
\oplus &: \text{Blend Equation（如 Add, Substract, Reverse Substract）}
\end{align}
```

不同的混合模式（如 Alpha Blending、Additive Blending 等）就是透過調整 F_src 與 F_dst 來實現。

## 透明效果

GPU 使用 Blending 可實現多樣化的透明顏色混合，在繪圖或遊戲畫面中，常見的主流透明混合效果有：
- Alpha Blending (Alpha 混合)
- Additive Blending (加法混合)
- Screen/Multiply/Overlay

### Alpha Blending

最常見的透明繪圖透明混色方法，透過 Alpha 通道控制物體透明度，實現玻璃、水面、煙霧等半透明效果。透明物體需要從後往前排序繪製，確保混合顏色計算正確，同時關閉深度寫入以避免遮擋後方物體。

**設置參數：**
- Source Factor: `SRC_ALPHA`
- Destination Factor: `ONE_MINUS_SRC_ALPHA`
- Blend Equation: `FUNC_ADD`

**公式：**
```math
\begin{aligned}
&C_{out} = C_{src} \times \alpha_{src} + C_{dst} \times (1 - \alpha_{src}) \\
\\
&\alpha_{src} \text{ 值範圍 } 0 \sim 1 \text{：} \\
&\alpha = 0 \text{：完全透明} \\
&\alpha = 1 \text{：完全不透明} \\
&\alpha = 0.5 \text{：50\% 透明度}
\end{aligned}
```

### Additive Blending

製作發光效果的最主流透明方案，適用於如火焰、煙花、魔法光效、鐳射光束等特效。將來源顏色直接疊加到目標顏色上，使畫面變得更亮更鮮豔。加法混合的特點是越疊加越亮，需注意顏色亮度太亮的問題(顏色加總逼近白色)。

**設置參數：**
- Source Factor: `SRC_ALPHA` 或 `ONE`
- Destination Factor: `ONE`
- Blend Equation: `FUNC_ADD`

**公式：**
```math
\begin{aligned}
&C_{out} = C_{src} \times F_{src} + C_{dst} \times 1.0 \\
\\
&\text{常見組合：} \\
&C_{out} = C_{src} \times \alpha_{src} + C_{dst} \times 1.0 \quad \text{(SRC\_ALPHA, ONE)} \\
&C_{out} = C_{src} \times 1.0 + C_{dst} \times 1.0 \quad \text{(ONE, ONE)} \\
\\
&\text{效果特性：} \\
&\text{• 顏色值只會增加，不會減少} \\
&\text{• 黑色 (0,0,0) 不會影響最終顏色} \\
&\text{• 重疊區域會產生明亮的累積效果} \\
&\text{• 適合粒子系統和光效渲染}
\end{aligned}
```

### Screen

### Multiply

### Overlay

# 參考延伸閱讀

[OpenGL Blending](https://www.khronos.org/opengl/wiki/blending)