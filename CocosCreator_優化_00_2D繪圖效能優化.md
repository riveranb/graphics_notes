# Cocos Creator 優化 - 2D繪圖效能優化
電腦圖學 (Computer Graphics) 繪圖 (Rendering)：三角面組成模型 (Mesh)，透過材質 (Material) 指定該模型外觀 (顏色/貼圖/透明度/...)；CPU 端整理此一系列繪圖資料，使用 Graphics API (OpenGL/Vulkan/Metal/...) 傳送到 GPU (Video Memory) 端通知 GPU 完成該次繪圖渲染工作。以上過程稱為一個 Draw Call 工作完成。
![alt text](images/point_line_triangle_mesh.png)

![a](images/drawcall_cpu_gpu.webp)

## 效能問題
CPU 端先進行繪圖資料準備工作然後傳送資料到 GPU 端，GPU 等收到繪圖指令才能完成繪圖渲染工作，因此過程牽涉到 CPU - GPU 的同步等待。故 Draw Calls 越少需要做的同步工作就越少。

## Draw Call (Batches) 合併
Cocos Creator 引擎依照 Canvas 根節點之下子節點樹，依上至下，淺至深的順序將 2D 內容 (UIRenderer) 繪製出來。過程中如果每個 UIRenderer 都單獨送出去繪製，每個 UIRenderer 就會產生 1 新的 Draw Call。

Cocos Creator 判斷繪圖順序上多個連續的 UIRenderer 繪圖資料如果可以合併，就自動處理繪圖資料合併工作 (Merge Batches)，減少 Draw Call 工作次數。

### 合併條件
2 個繪圖來源是否可合併最主要看是否共用相同的材質 (Material) 實體為原則。

2D 組件中最主要的 Sprite 與 Label 組件皆使用同一套 (Sprite) Shader 進行繪圖，故他們預設使用同一個材質，決定兩者之間 Draw Call 能不能合併的關鍵變成是否使用同一張來源貼圖 (Texture)。

# 參考延伸閱讀
[Cocos Creator 性能优化：DrawCall](https://mp.weixin.qq.com/s?__biz=MzI3MDQ1Mzc5MQ==&mid=2247486960&idx=1&sn=4f3dc5a7f588fb7a3cc9122369ee14da&scene=21)

[Cocos Creator 3.8 - 2D UI DrawCall优化详解（上）](https://blog.csdn.net/lizhong2008/article/details/133715903)
