# 遊戲開發 - GPU Shader
前面介紹 Fixed Function Pipeline，GPU 依繪圖管線完成固定繪圖工作。但開發者需要更多彈性，因此寫給 GPU 執行的程式的概念被發明，也就是著色器 (Shader)。

## Programmable Pipeline

續文章 ([A Trip Down The Graphics Pipeline](https://www.thecandidstartup.org/2023/03/13/trip-graphics-pipeline.html)) 中介紹可程序化繪圖管線 (Graphics Programmable Pipeline)，Shader 即一起被發明提出。接下來簡介發展史。

### 2001 ~ 2005 主流 Programmable Vertex & Fragment Shader

![programmable shader](images/graphics_pipeline_programmable_shaders.svg)

Shader 突破了原本固定繪圖管線的硬體限制。這時期 GPU 有頂點 (Vertex shader) 和像素片段 (Fragment shader) 2 種專門處理單元。Graphics API，OpenGL 1.4 和 Direct3D 8 推出革命性的高階著色器語言 (High-Level Shader Language)，為 C 語言相似的語法，編譯後成為低階 Shader 組合語言程式集。

有 Shader 概念後，軟體技術推出了材質 (Material) 管理 (優化編譯 Shader 流程)，並設計渲染通道 (rendering pass) 繪圖流程來完成多種光照功能 (Lighting)。

### 2006 ~ 2010 主流 Unified Shader Model

![unified shader](images/graphics_pipeline_unified_shader_model.svg)

GPU 演進推出統一的 Shader 架構執行單元，實現更高度平行優化地調度執行 vertex 與 fragment shaders。

此時期推出幾何著色器 (Geometry Shader)。著名的延遲渲染 (Deferred Rendering) 技術被發明以實現複雜的(多光源)光照繪圖功能，成為主流的遊戲繪圖技術。

### 2011 ~ 2015 主流 tesselation & compute shader

![tessellation compute](images/graphics_pipeline_tesselation_compute_shader.svg)

這時期推出曲面細分著色器 (Tesselation Shader)。Graphics API 開始支持(有限的)多線程繪圖 (Multi-Threading Rendering)。然後是推出計算著色器 (Compute Shader)，擴展 GPU 上進行非圖形渲染之通用計算。

### 2016 ~ 2020 主流 (Vulkan | Direct3D 12 | Metal) for GPGPU

![gpgpu](images/graphics_pipeline_gpgpu.svg)

這時期推出全新架構的 Graphics API，Direct3D 12 和 Vulkan (下一世代的 OpenGL)。新 API 賦予開發者前所未有的硬體控制能力，但同時也增加了使用複雜度。開發者現在能直接操作 GPU 命令緩衝區、精確控制 CPU 與 GPU 間的內存同步，以及自主管理數據緩衝區格式。Compute Shader 可在 GPU 上直接生成渲染所需的輸入數據，實現 GPU-Driven Rendering。

### 2021 ~ (2024+) Specialized Hardware

![specialized](images/graphics_pipeline_specialization.svg)

GPU 硬體創新添加了 2 種新型專用單元：
1. **RTX 核心**：硬體加速光線追蹤 (Ray Tracing)。
2. **AI 核心**：執行預先訓練好的機器學習模型，用於後處理任務，如降噪 (適合 Ray Tracing)、抗鋸齒、上採樣、甚至生成中間幀 (Intermediate Frame) 以提升感知幀率 (Frames Per Second，FPS)。

另 [DirectStorage](https://github.com/microsoft/DirectStorage) 技術也允許數據直接高速從 SSD 加載到 GPU。

## Shader

![gpu rendering](images/graphics_pipeline_rendering_flow.jpg)

上圖簡易示意繪圖管線的繪圖過程，下圖是更詳細的近代 Graphics Pipeline 架構流程圖。接著介紹最重要的 2 個 Shaders。預設以 OpenGL API 系列以及 GLSL 語法為前提做介紹。

![gpu pipeline](images/graphics_pipeline_wiki.svg)

### Vertex Shader

繪圖管線中首先執行的可程式化階段，主要負責處理每個頂點的位置和屬性變換。

**輸入 (Input)**:
- `attribute`：頂點數據，如位置 (`vec3 position`)、法線 (`vec3 normal`)、紋理座標 (`vec2 texCoord`) 等...
- `uniform`：由應用程式提供的全局變數，如變換矩陣 (`mat4 modelViewMatrix`, `mat4 projectionMatrix`)

**輸出 (Output)**:
- `varying`/`out`：傳遞給 Fragment Shader 的數據 (後續像素計算處理用)，如插值後的紋理座標、法線等。
- `gl_Position`：必須輸出的內建變數，表示頂點在裁剪空間的位置 (4D 向量)

```glsl
// 頂點屬性 (輸入)
attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord;

// 全局變數 (輸入)
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

// 傳遞給片段著色器的變數 (輸出)
varying vec2 vTexCoord;
varying vec3 vNormal;

void main() {
    // 計算裁剪空間的頂點位置
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    
    // 傳遞插值數據給片段著色器
    vTexCoord = texCoord;
    vNormal = normal;
}
```

### Fragment Shader / Pixel Shader

處理光柵化的每個像素 (片段，即一區塊的像素，如 2x2 Pixels)，決定最終的像素顏色輸出。

**輸入 (Input)**:
- `varying`/`in`：從 Vertex Shader 插值傳來的數據。
- `uniform`：全局變數，如貼圖紋理採樣器 (`sampler2D texture`)、光照參數等...
- `gl_FragCoord`：內建變數，表示片段在(螢幕)窗口座標中的位置。

**輸出 (Output)**:
- `gl_FragColor`：片段的最終顏色 (較新 GLSL 中為 `out vec4 fragColor`)。

```glsl
// 從頂點著色器傳來的插值數據 (輸入)
varying vec2 vTexCoord;
varying vec3 vNormal;

// 全局變數 (輸入)
uniform sampler2D diffuseMap;
uniform vec3 lightDir;
uniform vec3 lightColor;

void main() {
    // 採樣紋理
    vec4 texColor = texture2D(diffuseMap, vTexCoord);
    
    // 簡單漫反射光照計算
    vec3 normal = normalize(vNormal);
    float diffuseFactor = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = lightColor * diffuseFactor;
    
    // 最終輸出顏色
    gl_FragColor = texColor * vec4(diffuse, 1.0);
}
```

繪圖過程中 Vertex Shader 負責空間轉換和頂點處理，而 Fragment Shader 則處理材質、光照和最終的像素著色，共同完成一個幾何形狀 (Primitive，ex. Triangles) 之 GPU 渲染工作。

# 參考延伸閱讀

[A Trip Down The Graphics Pipeline](https://www.thecandidstartup.org/2023/03/13/trip-graphics-pipeline.html)