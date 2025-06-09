# 遊戲開發 - GPU 顏色混合 Blending

Blending 位於 GPU Graphics Pipeline 處理中 Per-Fragment Operations 階段，混合新舊像素顏色，實現透明、發光等特效。

## 透明 Transparent

透明效果讓物體呈現半透明或完全透明狀態。在 Graphics Rendering 中顏色的透明度透過 Alpha 通道控制。透明物體不能直接覆蓋背景，需要與後方像素進行顏色混合。常見透明混合顏色公式：

C_out = C_source × α_source + C_destination × (1 - α_source)

其中：
- C_source：新繪製來源像素顏色
- C_destination：Frame Buffer 中目標像素原有顏色
- α_source：新來源像素的透明度值