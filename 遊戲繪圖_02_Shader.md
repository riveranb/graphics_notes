# 遊戲開發 - GPU Shader
前面介紹 Fixed Function Pipeline，GPU 依繪圖管線完成固定繪圖工作。但開發者需要更多彈性，因此寫給 GPU 執行的程式的概念被發明，也就是著色器 (Shader)。

## Programmable Pipeline

續文章 ([A Trip Down The Graphics Pipeline](https://www.thecandidstartup.org/2023/03/13/trip-graphics-pipeline.html#text=2001-2005%20:%20Programmable%20Vertex%20and%20Fragment%20Shaders:~:text=2001%2D2005%20%3A%20Programmable%20Vertex%20and%20Fragment%20Shaders)) 中介紹可程序化繪圖管線，Shader 即一起被發明提出。

### 2001 ~ 2005 主流 Programmable Vertex & Fragment Shader

![programmable shader](images/graphics_pipeline_programmable_shaders.svg)

Shader 突破了原本固定繪圖管線的硬體限制。這時期 GPU 有頂點 (Vertex shader) 和像素片段 (Fragment shader) 2 種專門處理單元。Graphics API，OpenGL 1.4 和 Direct3D 8 推出革命性的高階著色器語言 (High-Level Shader Language)，為 C 語言相似的語法，編譯後成為低階 Shader 組合語言程式集。

有 Shader 概念後，軟體技術推出了材質 (Material) 管理 (優化編譯 Shader 流程)，並設計渲染通道 (rendering pass) 繪圖流程來完成多種光照功能 (Lighting)。

### 2006 ~ 2010 主流 Unified Shader Model

![unified shader](images/graphics_pipeline_unified_shader_model.svg)

GPU 演進推出統一的 Shader 架構執行單元，實現更高度平行優化地調度執行 vertex 與 fragment shaders。

OpenGL 3 和 Direct3D 10 推出幾何著色器 (Geometry Shader)。著名的延遲渲染 (Deferred Rendering) 技術被發明以實現複雜的(多光源)光照繪圖功能。

### 2011 ~ 2015 主流 tesselation & compute shader

![tessellation compute](images/graphics_pipeline_tesselation_compute_shader.svg)

這一時期加入曲面細分著色器，可動態增加幾何細節，理論上擴展了簡化階段的硬體支持。但實際應用中，曲面細分需要特別的內容創建方式，對多數用途過於複雜。

API開始支持有限的多線程，並引入計算著色器，使GPU可用於非圖形計算，如物理和模擬引擎。每幀渲染時CPU需協調計算著色器和圖形管線的工作流程。

### 2016 ~ 2020 主流 (Vulkan | Direct3D 12 | Metal) for GPGPU

![gpgpu](images/graphics_pipeline_gpgpu.svg)

這時期推出全新API（Direct3D 12、Vulkan），給開發者更大控制權。應用程序直接組裝GPU命令，管理CPU和GPU共享內存，計算著色器可不經CPU直接生成渲染輸入。

這為GPU驅動渲染開創可能，3D場景可完全在GPU上管理，數據僅在初始加載和更新時在CPU和GPU間傳輸，大幅減輕CPU渲染負擔。

### 2021 ~ Specialized Hardware

![specialized](images/graphics_pipeline_specialization.svg)

近期創新主要在硬體，添加了兩種新型專用單元：

1. **RTX核心**：加速光線追蹤，用GPU特定加速結構實現高效光線-場景相交。多數應用採用混合方法，使用光柵化確定可見性，再用有限光線追蹤增強光照效果。

2. **AI核心**：執行機器學習模型，用於後處理任務，如降噪、抗鋸齒、上採樣等。

DirectStorage技術也允許數據直接高速從SSD加載到GPU，最小化CPU參與，甚至支持GPU直接解壓數據。

## 總結
從固定函數到今日的完全可程式化管線，GPU技術飛速發展。現代圖形硬體和API為遊戲開發者提供了前所未有的創意空間和表現力。
