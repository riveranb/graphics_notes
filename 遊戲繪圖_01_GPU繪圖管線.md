# 遊戲開發 - GPU繪圖管線
繪圖管線(Rendering Pipeline | Graphics Pipeline)意指 3D 場景內容轉換成為 2D 影像結果的運作流程。可概略分為以下階段：
1. **應用階段 (Application)**  
   在 CPU 進行資料的準備與遊戲邏輯處理，佈局場景並喚起繪圖指令。
2. **幾何處理 (Geometry Processing)**  
   於 GPU 端處理頂點 (Vertex)、圖元 (Primitive) 的座標轉換與光照運算，可包含 Tessellation 與幾何著色器階段。
3. **光柵化 (Rasterization)**  
   將 2D 圖元轉換為眾多片段 (Fragments)，建立像素 (Pixel) 資訊。
4. **片段著色 (Fragment Shading)**  
   決定每個片段的顏色與深度，並透過深度測試 (Depth)、模板測試 (Stencil)、透明混合 (Alpha Blending) 等技術產生最終輸出。
5. **輸出合成 (Output Merging)**  
   將片段結果寫入 Framebuffer 完成 2D 圖像。

# 參考延伸閱讀
