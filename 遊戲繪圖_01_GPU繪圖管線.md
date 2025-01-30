# 遊戲開發 - GPU繪圖管線
繪圖管線(Rendering Pipeline | Graphics Pipeline)意指 3D 場景內容轉換成為 2D 影像結果的運作流程。可概略分為以下 5 階段：
1. **應用階段 (Application)**  
2. **幾何處理 (Geometry Processing)**  
3. **光柵化 (Rasterization)**  
4. **片段著色 (Fragment Shading)**  
5. **輸出合成 (Output Merging)**  

從結果反推 GPU 繪圖管線的運作流程：

5. 最終階段是**輸出合成 (Output Merging)**，將所有處理完成的片段資訊整合並寫入 Framebuffer，產生最終的 2D 畫面。

4. 在此之前的**片段著色 (Fragment Shading)** 階段，GPU 會為每個片段計算顏色與深度值，並透過一系列測試（深度、模板）和混合運算，決定最終的像素呈現。

3. 要有片段才能著色，因此在**光柵化 (Rasterization)** 階段，GPU 會將 2D 投影後的圖元分解成大量的片段(Fragment)。片段是一個包含位置、顏色、深度等資訊的資料結構，每個片段都對應到螢幕上的一個像素位置。這些片段會被送往下一個階段進行著色處理。

2. 在光柵化之前，**幾何處理 (Geometry Processing)** 階段負責將 3D 物件的頂點進行座標轉換，包含視角轉換、投影等運算，同時也處理光照計算。

1. 整個流程的起點是 **應用階段 (Application)**，由 CPU 負責準備場景資料、處理遊戲邏輯，並發送繪圖指令給 GPU 開始渲染流程。


# 參考延伸閱讀
