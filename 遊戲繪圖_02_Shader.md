# 遊戲開發 - GPU Shader
前面介紹 Fixed Function Pipeline，GPU 依繪圖管線完成固定繪圖工作。但開發者需要更多彈性，因此寫給 GPU 執行的程式的概念被發明，也就是著色器 (Shader)。

## Programmable Pipeline

續文章 ([A Trip Down The Graphics Pipeline](https://www.thecandidstartup.org/2023/03/13/trip-graphics-pipeline.html#:~:text=2001%2D2005%20%3A%20Programmable%20Vertex%20and%20Fragment%20Shaders)) 中介紹可程序化繪圖管線，Shader 即一起被發明提出。

### 2001 ~ 2005 主流 Programmable Vertex & Fragment Shader

![programmable shader](images/graphics_pipeline_programmable_shaders.svg)

Shader 突破了原本固定繪圖管線的限制。這時期 GPU 有頂點 (Vertex shader) 和像素片段 (Fragment shader) 2 種專門處理單元。Graphics API，OpenGL 1.4 和 Direct3D 8 推出革命性的高階著色器語言 (High-Level Shader Language)，為 C 語言相似的語法，編譯後成為低階 Shader 組合語言程式集。

有 Shader 概念後，軟體技術推出了材質 (Material) 管理 (優化編譯 Shader 流程)，並設計渲染通道 (rendering pass) 繪圖流程，完成更複雜的光照功能 (Lighting)。

### 2006 ~ 2010 主流 Unified Shader Model

![unified shader](images/graphics_pipeline_unified_shader_model.svg)

隨著硬體演進，統一著色器模型架構出現，只使用一種類型執行單元，由調度器動態分配頂點和片段處理工作，提高了硬體利用率。固定函數管線大部分被移除，只保留光柵化和混合操作。

OpenGL 3和Direct3D 10加入了幾何著色器，處理完整圖元並能輸出不同圖元。應用程序也開始使用延遲著色技術，通過G緩衝區儲存片段屬性，僅對可見像素計算光照，提高複雜場景的效率。

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