# 遊戲開發 - 光照 Lighting

遊戲畫面氛圍影響最大元素當然是打光。光照 (Lighting) 是在計算物體表面與光源的互動，決定表面明暗與色彩。現實世界中，物體可見是因為光線照射到物體表面後反射被人眼觀測到。電腦圖學 (Computer Graphics) 以數學模型模擬光線與物體表面的互動。

## 光照模型 Lighting Model

光照模型 (Lighting Model / Illumination Model) 是模擬光線與物體表面互動的數學公式。主流光照模型將反射光分解為數個主要分量：

**1. 環境光 (Ambient)**

模擬場景中無方向性的間接光照，為場景提供基礎亮度。環境光不考慮光源位置、表面法線等因素，僅為物體表面提供均勻的基礎顏色。

```math
\begin{aligned}
&I_{ambient} = k_a \times I_a \\
&k_a：材質環境光反射係數 \\
&I_a：環境光顏色強度
\end{aligned}
```

**2. 漫反射光 (Diffuse)**

模擬粗糙表面將光線向各方向均勻散射的效果，遵循 Lambert 定律。漫反射讓物體表面呈現基本的明暗變化，是塑造物體形狀的主要光照分量。

```math
\begin{aligned}
&I_{diffuse} = k_d \times I_l \times \max(N \cdot L, 0) \\
&k_d：材質漫反射係數(通常對應物體的基本顏色) \\
&I_l：光源顏色強度 \\
&N：表面法向量(單位向量) \\
&L：指向光源的方向向量(單位向量) \\
&N \cdot L：法向量與光源方向的點積(投影比例)，表示光照強度。
\end{aligned}
```

**3. 鏡面反射光 (Specular)**

模擬光滑表面產生的高光效果，只在特定視角可見。鏡面反射讓物體表面呈現亮點，增強材質的光澤感。

```math
\begin{aligned}
&I_{specular} = k_s \times I_l \times \max(R \cdot V, 0)^{n} \\
&k_s：材質鏡面反射係數 \\
&I_l：光源顏色強度 \\
&R：光線反射方向向量(單位向量) \\
&V：指向視點的方向向量(單位向量) \\
&n：光澤度指數 (Shininess)，值越大高光範圍越小越集中 \\
&R \cdot V：光反射方向與視線方向的點積(投影比例)，表示高光強度
\end{aligned}
```

### Phong Reflection Model

Phong 光照模型 (Bui Tuong Phong，1975 年提出)，將光照分解為環境光、漫反射與鏡面反射三個分量相加。

```math
\begin{aligned}
&I = I_{ambient} + I_{diffuse} + I_{specular} \\
&I = k_a \times I_a + k_d \times I_l \times \max(N \cdot L, 0) + k_s \times I_l \times \max(R \cdot V, 0)^{n} \\
&\text{其中反射向量 } R \text{ 計算：} \\
&R = 2(N \cdot L) \times N - L
\end{aligned}
```

### Blinn-Phong Reflection Model

Blinn-Phong 是 Phong 模型的改良版 (James Blinn，1977 年提出)。主要差異在使用半程向量 (Half Vector) 取代反射向量，計算效率更高且視覺效果更自然。

```math
\begin{aligned}
&I_{specular} = k_s \times I_l \times \max(N \cdot H, 0)^{n} \\
&\text{其中半程向量 } H \text{ 計算：} \\
&H = \frac{L + V}{|L + V|} \\
&H：光線方向與視線方向的半程向量(單位向量) \\
&L：指向光源的方向向量(單位向量) \\
&V：指向視點的方向向量(單位向量)
\end{aligned}
```

## 光源類型

遊戲引擎支援多種光源類型，以下介紹最常見的基礎光源功能。

### 平行光 Directional Light

模擬無限遠處的光源，如太陽光。所有光線平行且方向相同，不考慮光源位置，只有光照方向。適用於大範圍的主光源照明。

- 光線方向固定
- 所有位置接收相同方向的光照
- 計算簡單，效能最佳
- 無光源衰減

### 點光源 Point Light

從單一點向四周發散的光源，如燈泡、火把。光照強度隨距離衰減。

- 光線從光源位置向外發散
- 每個位置的光照方向不同
- 具有距離衰減效果

**衰減公式：**

```math
\begin{aligned}
&Attenuation = \frac{1.0}{k_c + k_l \times d + k_q \times d^2} \\
&d：片段到光源的距離 \\
&k_c：常數衰減項 \\
&k_l：線性衰減項 \\
&k_q：二次衰減項
\end{aligned}
```

### 聚光燈 Spot Light

具有方向性的錐形光源，如手電筒、舞台聚光燈。結合 Point Light 的距離衰減與方向限制。

- 從特定位置發出錐形光線
- 具有照射方向與照射角度
- 光照強度隨距離與角度衰減

**角度衰減計算：**

```math
\begin{aligned}
&Intensity = \frac{\cos(\theta) - \cos(outerCutoff)}{\cos(innerCutoff) - \cos(outerCutoff)} \\
&\theta：光線方向與片段方向的夾角 \\
&innerCutoff：內圈角度(全亮) \\
&outerCutoff：外圈角度(漸暗至0)
\end{aligned}
```

# 參考延伸閱讀

[Computer Graphics Lighting](https://en.wikipedia.org/wiki/Computer_graphics_lighting)

[Phong Reflection Model](https://en.wikipedia.org/wiki/Phong_reflection_model)

[Blinn-Phong Reflection Model](https://en.wikipedia.org/wiki/Blinn%E2%80%93Phong_reflection_model)

[OpenGL - Basic Lighting](https://learnopengl.com/Lighting/Basic-Lighting)