# Cocos Creator 優化 - 2D繪圖效能優化
電腦圖學 (Computer Graphics) 繪圖 (Rendering) 工作原理：三角面組成模型資料 (Mesh)，透過材質 (Material) 指定該模型如何呈現外觀 (顏色/貼圖/透明度/...)；CPU 端將這些資訊整理成一系列繪圖資料，使用 Graphics API (OpenGL/Direct3D/Vulkan/Metal/...) 將資訊傳送到 GPU (Video Memory) 端，透過繪圖指令通知 GPU 進行該組繪圖資料的繪圖渲染工作，畫到指定的螢幕區域。以上過程可稱為一個 Draw Call 工作完成。
![alt text](images/point_line_triangle_mesh.png)

# 參考延伸閱讀
