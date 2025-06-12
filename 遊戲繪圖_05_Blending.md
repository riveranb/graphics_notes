# 遊戲開發 - GPU 顏色混合 Blending

Blending 位於 GPU Graphics Pipeline 處理中 Per-Fragment Operations 階段，混合新舊像素顏色，實現透明、發光等特效。

## 透明 Transparent

透明效果讓物體呈現半透明或完全透明狀態。在 Graphics Rendering 中顏色的透明度透過 Alpha 通道控制。透明物體不能直接覆蓋背景，需要與後方像素進行顏色混合。常見透明混合顏色公式：

C_out = C_source × α_source + C_destination × (1 - α_source)

其中：
- C_source：新繪製來源像素顏色
- C_destination：Frame Buffer 中目標像素原有顏色
- α_source：新來源像素的透明度值

### 透明繪圖排序

透明繪圖顏色使用混合顏色公式計算得出，公式的前提是新的來源透明顏色與之前的透明顏色混合，因此繪製順序會直接影響顏色結果。透明度混合公式不具交換性質，A 混合 B 與 B 混合 A 會產生不同顏色。不透明物體繪圖依賴 Depth Buffer (Z-Buffer) 深度測試自動解決遮擋。透明物體繪圖則無法寫入深度，因為會錯誤地覆蓋後方物體繪製結果。

解決方案：**從後往前繪圖 (Back-to-Front)**

![transparency sorting](images/transparency_back2front_sorting.png)

關閉透明物體深度寫入，按物體到攝影機距離排序，依序先繪製較遠物體再繪製較近物體，確保混合順序正確，即能計算正確透明混色結果。遊戲引擎/繪圖引擎都會正確處理透明物件的由後至前方排序工作，但也伴隨著(CPU端)計算代價

### 透明透空 Alpha Test

透明透空繪圖 (Alpha Test) 是透明度處理的替代方案，透過設定透明度門檻值 (Threshold) 決定像素保留或丟棄，避免複雜的顏色混合運算。透明度低於門檻值(如 0.5)的像素會被 GPU 丟棄 (Discard)，高於門檻值則當作完全不透明繪圖處理(並寫入深度)。透明透空無法產生平滑的透明漸變效果，邊緣易出現鋸齒 (Aliasing) 現象，適合用於有明確透明邊界的材質，如植物葉片、鐵絲網、UI 圖示等，不適合玻璃、煙霧等需要漸變透明的效果。

## 混合方案