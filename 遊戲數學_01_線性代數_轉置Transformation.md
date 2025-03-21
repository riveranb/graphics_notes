# 遊戲開發數學
## 電腦圖學 - 線性代數 - 轉換 (Transformation)

在電腦圖學中，轉換(Transformation)是一個非常重要的概念。它描述了如何將一個向量或點從一個座標空間映射到另一個座標空間。

## 線性轉換 (Linear Transformation)

線性轉換是保持向量加法和純量乘法的轉換。如果一個轉換 T 滿足以下兩個條件，就稱為線性轉換：

1. 加法性質：T(u + v) = T(u) + T(v)
2. 純量乘法性質：T(cu) = cT(u)

```math
$$T: \mathbb{R}^n \rightarrow \mathbb{R}^m$$
```

### 常見的線性轉換

#### 1. 反射 (Reflection)
反射是將向量沿著某個軸或平面映射到對稱位置的轉換。

例如，沿 X 軸反射的矩陣：
```math
$$\begin{bmatrix}
1 & 0 & 0 & 0 \\
0 & -1 & 0 & 0 \\
0 & 0 & -1 & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}$$
```

#### 2. 投影 (Projection)
投影是將向量投射到某個軸或平面上的轉換。

例如，投影到 XY 平面的矩陣：
```math
$$\begin{bmatrix}
1 & 0 & 0 & 0 \\
0 & 1 & 0 & 0 \\
0 & 0 & 0 & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}$$
```

#### 3. 切變 (Shear)
切變是保持某些平行線不變，但改變角度的轉換。

例如，X 方向的切變矩陣：
```math
$$\begin{bmatrix}
1 & a & 0 & 0 \\
0 & 1 & 0 & 0 \\
0 & 0 & 1 & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}$$
```

## 仿射轉換 (Affine Transformation)

仿射轉換是線性轉換加上平移的組合。它可以表示為矩陣乘法加上向量加法：

```math
$$T(v) = Av + b$$
```

其中 A 是線性轉換矩陣，b 是平移向量。

### 仿射轉換的性質

1. 保持平行線
2. 保持直線
3. 保持比例
4. 可以組合多個轉換

### 常見的仿射轉換組合

#### 1. 縮放後平移
```math
$$T = T_{translation} \cdot S_{scale} = 
\begin{bmatrix}
1 & 0 & 0 & tx \\
0 & 1 & 0 & ty \\
0 & 0 & 1 & tz \\
0 & 0 & 0 & 1
\end{bmatrix}
\cdot
\begin{bmatrix}
sx & 0 & 0 & 0 \\
0 & sy & 0 & 0 \\
0 & 0 & sz & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}$$
```

#### 2. 旋轉後平移
```math
$$T = T_{translation} \cdot R_{rotation} = 
\begin{bmatrix}
1 & 0 & 0 & tx \\
0 & 1 & 0 & ty \\
0 & 0 & 1 & tz \\
0 & 0 & 0 & 1
\end{bmatrix}
\cdot
\begin{bmatrix}
\cos \theta & -\sin \theta & 0 & 0 \\
\sin \theta & \cos \theta & 0 & 0 \\
0 & 0 & 1 & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}$$
```

## 齊次座標 (Homogeneous Coordinates)

在電腦圖學中，我們使用齊次座標來統一表示點和向量，並使用 4x4 矩陣來表示所有轉換。這樣做的好處是：

1. 可以用單一矩陣表示所有轉換（包括平移）
2. 可以方便地組合多個轉換
3. 可以區分點和向量（w = 1 表示點，w = 0 表示向量）

```math
點: P = \begin{bmatrix}
x \\
y \\
z \\
1
\end{bmatrix},
向量: V = \begin{bmatrix}
x \\
y \\
z \\
0
\end{bmatrix}
```

## 轉換的應用

### 1. 模型變換 (Model Transform)
用於改變物體在局部空間中的位置、方向和大小。

### 2. 視圖變換 (View Transform)
用於設定攝影機的位置和方向。

### 3. 投影變換 (Projection Transform)
用於將 3D 場景投影到 2D 螢幕上，包括透視投影和正交投影。

### 4. 視口變換 (Viewport Transform)
用於將規範化設備座標映射到螢幕座標。

## 轉換的組合

多個轉換可以通過矩陣乘法組合在一起。注意矩陣乘法的順序很重要，因為矩陣乘法不滿足交換律。

例如，要先旋轉再平移：
```math
$$P_{final} = T_{translation} \cdot R_{rotation} \cdot P_{original}$$
```

要先平移再旋轉：
```math
$$P_{final} = R_{rotation} \cdot T_{translation} \cdot P_{original}$$
```

這兩種組合會得到不同的結果。在實際應用中，轉換的順序通常是：

1. 縮放 (Scale)
2. 旋轉 (Rotate)
3. 平移 (Translate)

```math
$$T_{final} = T_{translation} \cdot R_{rotation} \cdot S_{scale}$$
```
