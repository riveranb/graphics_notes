# 遊戲開發 - Texture Mapping

繪圖過程 Fragment Shader 最終要計算出像素的顏色 (Color: [red, green, blue, alpha]) 結果。一般來說顏色可由模型中的頂點顏色 (Vertex Color) 決定，也可以通過材質 (Material) 資料指定的顏色，再來還有來自指定貼圖 (Texture) 的顏色。指定一張貼圖將其色彩映射到指定的模型三角面上的技術即是貼圖映射 (Texture Mapping)。

![alt text](images/mesh_texturemapping.png)

## 貼圖資源 Texture

貼圖 (Texture) 資源是指用於描述模型表面細節的影像 (Image) 資源，通常以 2D 圖像的形式存儲，常見的貼圖檔案格式包括 BMP、PNG、JPEG、DDS、KTX 等。貼圖可以儲存各種不同目的之資訊，如基本色彩 (Base Color/Diffuse/Albedo)、法線 (Normal)、高光 (Specular)、粗糙度 (Roughness) 等。

## 貼圖映射 Texture Mapping

將 2D 圖像 (Texture) 映射到 3D 模型表面的技術，讓模型表面呈現更豐富的視覺效果。

![texturemapping](images/texturemapping_uv.png)

### 貼圖座標 UV Coordinates

貼圖座標系統使用 U、V 兩個軸向來定位貼圖上的像素位置，U 代表水平方向，V 代表垂直方向，座標範圍為 [0,1]。

![alt text](images/uv_coordinates.png)

每個頂點除了位置座標外，還需要定義對應的 UV 座標，用於指定該頂點在貼圖上的採樣位置。

### 貼圖採樣 Texture Sampling

在光柵化過程中，對於三角形內部的每個像素，需要根據三個頂點的 UV 座標進行線性內插，計算出該像素在貼圖上的採樣位置。

![alt text](images/texture_sampling.png)

### 貼圖過濾 Texture Filtering

由於貼圖解析度與螢幕像素解析度可能不同，在採樣時需要進行過濾處理：

1. 最近點採樣 (Nearest Point Sampling)
   - 直接取最接近的貼圖像素值
   - 優點：計算簡單
   - 缺點：可能產生鋸齒狀邊緣

2. 線性過濾 (Linear Filtering)
   - 對相鄰的貼圖像素進行線性內插
   - 優點：平滑的過渡效果
   - 缺點：可能造成模糊

3. 各向異性過濾 (Anisotropic Filtering)
   - 考慮視角方向的過濾方式
   - 優點：改善斜向紋理的清晰度
   - 缺點：計算量較大

![alt text](images/texture_filtering.png)

### 多重貼圖 Multiple Textures

一個模型表面可以同時使用多張貼圖來實現更複雜的視覺效果：

1. 漫反射貼圖 (Diffuse/Albedo Map)
   - 定義物體表面的基本顏色

2. 法線貼圖 (Normal Map)
   - 通過改變表面法線方向來模擬細節凹凸

3. 高光貼圖 (Specular Map)
   - 控制表面反光強度

4. 粗糙度貼圖 (Roughness Map)
   - 控制表面粗糙程度

![alt text](images/multiple_textures.png)

### 貼圖壓縮 Texture Compression

為了減少記憶體使用和頻寬消耗，貼圖通常會進行壓縮：

1. 無損壓縮
   - 保持原始圖像品質
   - 壓縮率較低

2. 有損壓縮
   - 允許一定程度的品質損失
   - 壓縮率較高
   - 常用格式：DXT、ETC、ASTC

### 貼圖優化 Texture Optimization

1. 貼圖大小
   - 根據實際需求選擇適當的解析度
   - 避免過大的貼圖造成記憶體浪費

2. 貼圖合併
   - 將多個小貼圖合併成一張大貼圖
   - 減少 Draw Call 次數

3. Mipmap
   - 預先生成不同解析度的貼圖
   - 根據距離動態選擇適當的解析度
   - 改善遠處物體的渲染品質

![alt text](images/mipmap.png)

# 參考延伸閱讀

