# 遊戲開發 - GPU Shader
前面介紹 Fixed Function Pipeline，GPU 依繪圖管線完成固定繪圖工作。但開發者需要更多彈性，因此寫給 GPU 執行的程式的概念被發明，也就是 Shader。

## Programmable Pipeline

續文章 ([A Trip Down The Graphics Pipeline](https://www.thecandidstartup.org/2023/03/13/trip-graphics-pipeline.html#:~:text=2001%2D2005%20%3A%20Programmable%20Vertex%20and%20Fragment%20Shaders)) 中介紹，可程序化繪圖管線被提出並發揚光大。

2001 ~ 2005 主流 programmable vertex & fragment shader

![programmable shader](images/graphics_pipeline_programmable_shaders.svg)

2006 ~ 2010 主流 unified shader model

![unified shader](images/graphics_pipeline_unified_shader_model.svg)

2011 ~ 2015 主流 tesselation & compute shader

![tessellation compute](images/graphics_pipeline_tesselation_compute_shader.svg)

2016 ~ 2020 主流 (Vulkan | Direct3D 12 | Metal) for GPGPU

![gpgpu](images/graphics_pipeline_gpgpu.svg)

2021 ~ specialized hardware

![specialized](images/graphics_pipeline_specialization.svg)