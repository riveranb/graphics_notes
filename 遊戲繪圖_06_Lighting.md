# 遊戲開發 - 光照 Lighting

光照 (Lighting) 在計算物體表面與光源的互動，決定表面明暗與色彩。現實世界中，物體可見是因為光線照射到物體表面後反射進入眼睛。電腦圖學透過數學模型模擬光線與物體表面的互動。光線照射到物體表面時會產生：
- **反射 (Reflection)**：光線從表面反彈
- **吸收 (Absorption)**：部分光能被物體吸收轉為熱能
- **折射 (Refraction)**：光線穿透物體改變方向
- **散射 (Scattering)**：光線在物體內部多次反射

![light interaction](images/lighting_interaction.png)

## 光照模型 Lighting Model

光照模型 (Lighting Model / Illumination Model) 是模擬光線與物體表面互動的數學公式。主流光照模型將反射光分解為多個分量：

### 光照分量

**1. Ambient (環境光)**

模擬場景中無方向性的間接光照，為場景提供基礎亮度。環境光不考慮光源位置、表面法線等因素，僅為物體表面提供均勻的基礎顏色。

\[
I_{ambient} = k_a \times I_a
\]

- \(k_a\)：材質環境光反射係數
- \(I_a\)：環境光顏色強度

**2. Diffuse (漫反射)**

模擬粗糙表面將光線向各方向均勻散射的效果，遵循 Lambert 定律。漫反射讓物體表面呈現基本的明暗變化，是塑造物體形狀的主要光照分量。

\[
I_{diffuse} = k_d \times I_l \times \max(N \cdot L, 0)
\]

- \(k_d\)：材質漫反射係數（通常對應物體的基本顏色）
- \(I_l\)：光源顏色強度
- \(N\)：表面法向量（單位向量）
- \(L\)：指向光源的方向向量（單位向量）

![diffuse](images/lighting_diffuse.png)

**3. Specular (鏡面反射)**

模擬光滑表面產生的高光效果，只在特定視角可見。鏡面反射讓物體表面呈現亮點，增強材質的光澤感。

\[
I_{specular} = k_s \times I_l \times \max(R \cdot V, 0)^{n}
\]

- \(k_s\)：材質鏡面反射係數
- \(I_l\)：光源顏色強度
- \(R\)：光線反射方向向量（單位向量）
- \(V\)：指向視點的方向向量（單位向量）
- \(n\)：光澤度指數（Shininess），值越大高光範圍越小越集中

![specular](images/lighting_specular.png)

### Phong Reflection Model

Phong 光照模型由 Bui Tuong Phong 於 1975 年提出，是最經典的局部光照模型，將光照分解為環境光、漫反射與鏡面反射三個分量相加。

**完整公式：**

\[
I = I_{ambient} + I_{diffuse} + I_{specular}
\]

\[
I = k_a \times I_a + k_d \times I_l \times \max(N \cdot L, 0) + k_s \times I_l \times \max(R \cdot V, 0)^{n}
\]

其中反射向量 \(R\) 計算：

\[
R = 2(N \cdot L) \times N - L
\]

![phong model](images/lighting_phong_model.png)

**Shader 實現：**

```glsl
// Fragment Shader - Phong Lighting
varying vec3 vPosition;      // 世界空間頂點位置
varying vec3 vNormal;        // 世界空間法向量
varying vec2 vTexCoord;      // 紋理座標

uniform vec3 lightPos;       // 光源位置
uniform vec3 lightColor;     // 光源顏色
uniform vec3 viewPos;        // 相機位置

uniform vec3 ambientColor;   // 環境光顏色
uniform sampler2D diffuseMap; // 漫反射貼圖
uniform float shininess;     // 光澤度

void main() {
    // 採樣漫反射貼圖
    vec3 diffuseTexColor = texture2D(diffuseMap, vTexCoord).rgb;
    
    // 環境光
    vec3 ambient = ambientColor * diffuseTexColor;
    
    // 漫反射
    vec3 N = normalize(vNormal);
    vec3 L = normalize(lightPos - vPosition);
    float diffuseFactor = max(dot(N, L), 0.0);
    vec3 diffuse = lightColor * diffuseTexColor * diffuseFactor;
    
    // 鏡面反射 (Phong)
    vec3 R = reflect(-L, N);  // GLSL 內建反射函數
    vec3 V = normalize(viewPos - vPosition);
    float specularFactor = pow(max(dot(R, V), 0.0), shininess);
    vec3 specular = lightColor * specularFactor;
    
    // 最終顏色
    vec3 finalColor = ambient + diffuse + specular;
    gl_FragColor = vec4(finalColor, 1.0);
}
```

### Blinn-Phong Reflection Model

Blinn-Phong 是 Phong 模型的改良版，由 James Blinn 於 1977 年提出。主要差異在於鏡面反射的計算方式，使用半程向量 (Half Vector) 取代反射向量，計算效率更高且視覺效果更自然。

**鏡面反射公式：**

\[
I_{specular} = k_s \times I_l \times \max(N \cdot H, 0)^{n}
\]

其中半程向量 \(H\) 計算：

\[
H = \frac{L + V}{|L + V|}
\]

- \(H\)：光線方向與視線方向的半程向量（單位向量）
- \(L\)：指向光源的方向向量
- \(V\)：指向視點的方向向量

![blinn-phong](images/lighting_blinn_phong.png)

**Shader 實現：**

```glsl
// Fragment Shader - Blinn-Phong Lighting
void main() {
    vec3 diffuseTexColor = texture2D(diffuseMap, vTexCoord).rgb;
    
    // 環境光
    vec3 ambient = ambientColor * diffuseTexColor;
    
    // 漫反射
    vec3 N = normalize(vNormal);
    vec3 L = normalize(lightPos - vPosition);
    float diffuseFactor = max(dot(N, L), 0.0);
    vec3 diffuse = lightColor * diffuseTexColor * diffuseFactor;
    
    // 鏡面反射 (Blinn-Phong)
    vec3 V = normalize(viewPos - vPosition);
    vec3 H = normalize(L + V);  // 半程向量
    float specularFactor = pow(max(dot(N, H), 0.0), shininess);
    vec3 specular = lightColor * specularFactor;
    
    // 最終顏色
    vec3 finalColor = ambient + diffuse + specular;
    gl_FragColor = vec4(finalColor, 1.0);
}
```

**Blinn-Phong vs Phong：**
- Blinn-Phong 計算效率較高（避免反射向量計算）
- Blinn-Phong 在掠射角度下效果更自然
- Blinn-Phong 是現代遊戲引擎的主流選擇

## 光源類型

遊戲引擎支援多種光源類型，模擬不同的照明情境。

### Directional Light (平行光)

模擬無限遠處的光源，如太陽光。所有光線平行且方向相同，不考慮光源位置，只有光照方向。適用於大範圍的主光源照明。

- 光線方向固定
- 所有位置接收相同方向的光照
- 計算簡單，效能最佳
- 無光源衰減

```glsl
// Directional Light
uniform vec3 lightDir;  // 光照方向（單位向量）

vec3 L = normalize(-lightDir);  // 指向光源方向
float diffuseFactor = max(dot(N, L), 0.0);
```

![directional light](images/lighting_directional.png)

### Point Light (點光源)

從單一點向四周發散的光源，如燈泡、火把。光照強度隨距離衰減。

- 光線從光源位置向外發散
- 每個位置的光照方向不同
- 具有距離衰減效果

**衰減公式：**

\[
Attenuation = \frac{1.0}{k_c + k_l \times d + k_q \times d^2}
\]

- \(d\)：片段到光源的距離
- \(k_c\)：常數衰減項
- \(k_l\)：線性衰減項
- \(k_q\)：二次衰減項

```glsl
// Point Light
uniform vec3 lightPos;    // 光源位置
uniform float constant;   // 常數衰減
uniform float linear;     // 線性衰減
uniform float quadratic;  // 二次衰減

vec3 L = normalize(lightPos - vPosition);
float distance = length(lightPos - vPosition);
float attenuation = 1.0 / (constant + linear * distance + 
                           quadratic * distance * distance);

vec3 diffuse = lightColor * diffuseTexColor * diffuseFactor * attenuation;
```

![point light](images/lighting_point.png)

### Spot Light (聚光燈)

具有方向性的錐形光源，如手電筒、舞台聚光燈。結合 Point Light 的距離衰減與方向限制。

- 從特定位置發出錐形光線
- 具有照射方向與照射角度
- 光照強度隨距離與角度衰減

**角度衰減計算：**

\[
Intensity = \frac{\cos(\theta) - \cos(outerCutoff)}{\cos(innerCutoff) - \cos(outerCutoff)}
\]

- \(\theta\)：光線方向與片段方向的夾角
- \(innerCutoff\)：內圈角度（全亮）
- \(outerCutoff\)：外圈角度（漸暗至0）

```glsl
// Spot Light
uniform vec3 lightPos;       // 光源位置
uniform vec3 lightDir;       // 光照方向
uniform float innerCutoff;   // 內圈角度餘弦值
uniform float outerCutoff;   // 外圈角度餘弦值

vec3 L = normalize(lightPos - vPosition);
float distance = length(lightPos - vPosition);

// 距離衰減
float attenuation = 1.0 / (constant + linear * distance + 
                           quadratic * distance * distance);

// 角度衰減
float theta = dot(L, normalize(-lightDir));
float epsilon = innerCutoff - outerCutoff;
float intensity = clamp((theta - outerCutoff) / epsilon, 0.0, 1.0);

vec3 diffuse = lightColor * diffuseTexColor * diffuseFactor * 
               attenuation * intensity;
```

![spot light](images/lighting_spot.png)

# 參考延伸閱讀

[Computer Graphics Lighting](https://en.wikipedia.org/wiki/Computer_graphics_lighting)
