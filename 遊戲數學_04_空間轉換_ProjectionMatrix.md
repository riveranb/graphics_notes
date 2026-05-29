# 遊戲開發數學
## 電腦圖學 - 空間轉換 - Projection Matrix

Projection Matrix 是將頂點座標從 Camera Space 轉換至 Clip Space 的 4×4 轉換矩陣。它透過定義相機的「可視範圍」（View Frustum），決定哪些物件應該被繪製，同時也為後續的透視效果與深度計算提供必要的資訊。

![座標轉換流程](images/render_coord_transformation.png)

Projection Matrix 的工作：如果 View Matrix 是「把攝影機擺好位置」，Projection Matrix 就是「調整鏡頭焦距與取景範圍」。

1. **定義可視範圍**：透過 Near/Far Plane、Field of View 等參數界定 View Frustum (視錐體)，只有在此範圍內的物件才會被繪製。
2. **映射到標準化空間**：將 View Frustum 內的座標壓縮映射到一個標準化空間 NDC (Normalized Device Coordinates)，供 GPU (Graphics Pipeline) 統一處理。
3. **編碼深度資訊**：將座標 $z$ 值映射到 $[0, 1]$ 或 $[-1, 1]$ 的範圍，寫入 Depth Buffer (深度緩衝區) 用於遮擋判斷。
4. **透視效果**：透視投影 (Perspective Projection) 達成近大遠小效果。

## Clip Space 與 NDC 與透視除法

先認識 2 個關鍵的空間：**Clip Space (裁剪空間)** 與 **Normalized Device Coordinates (NDC，標準化設備座標)**。

相機捕捉到的範圍稱為**視錐體 Frustum**，我們要把這個 Frustum 裡的所有東西包裝進一個 $[-1, 1]$ 的「標準正方體」中，接下來方便 GPU 把畫面畫到 2D 螢幕上。轉換會經過 2 個階段：

1. **Clip Space**：頂點座標乘上 Projection Matrix 後轉換至此，為 4D 齊次座標 $(x, y, z, w)$。GPU 會針對每個頂點獨立判斷，拿頂點**各自的 $w$** 進行 **Clipping (裁剪)**：切除超出專屬 $[-w, w]$ 範圍的部分。這確保了後續除以 $w$ 時，結果必定落在 NDC 的 $[-1, 1]$ 內。
2. **NDC**：裁剪完畢後，GPU 自動執行透視除法 **(Perspective Division)**，將 $x, y, z$ 除以 $w$。

```math
\begin{aligned}
\begin{bmatrix} x_{ndc} \\ y_{ndc} \\ z_{ndc} \end{bmatrix}
&= \begin{bmatrix} x_c / w_c \\ y_c / w_c \\ z_c / w_c \end{bmatrix}
\end{aligned}
```

經過這個除法後，座標就正式進入了 NDC，變成範圍在 $[-1, 1]$ 之間的 3D 座標了。

> **初學者筆記：**
> 很多教材只會告訴你「投影矩陣能把 3D 轉 2D」。但實際上，投影矩陣**只負責準備好 $x, y, z$ 和 $w$**。真正產生「近大遠小」透視效果的關鍵，是 GPU 自動執行的「透視除法（除以 $w$）」。

## Perspective Projection (透視投影)

![透視投影](images/projection_perspective.png)

透視投影是最符合人類肉眼觀察世界的方式——距離越遠的東西看起來越小。這也是 Song Ho 文章中最精華的推導部分。

### 第一步：找出投影在近平面上的座標 (利用相似三角形)

![透視投影推導](images/render_project_perspective0.png)

想像攝影機放在原點 $(0, 0, 0)$，朝向 $-Z$ 軸看過去。在距離攝影機 $n$ (near) 的地方有一面「近平面」，也就是我們最終要投影成像的「底片」。

假設空間中有一個點 $P = (x_e, y_e, z_e)$，它投影到底片上的點叫 $P_p = (x_p, y_p, z_p)$。
從側面（Y-Z 平面）看過去，這是一個完美的**相似三角形**：

```math
\begin{aligned}
\frac{y_p}{n} &= \frac{y_e}{-z_e} \quad \Rightarrow \quad y_p = \frac{n \cdot y_e}{-z_e}
\end{aligned}
```

（注意：因為攝影機朝向 $-Z$ 方向，所以物體的 $Z$ 座標是負數，我們用 $-z_e$ 來表示距離）

同理，從上面（X-Z 平面）看過去，也可以推導出：

```math
\begin{aligned}
x_p &= \frac{n \cdot x_e}{-z_e}
\end{aligned}
```

**這就是產生「近大遠小」的核心公式**：所有的座標都要除以距離（$-z_e$）。

### 第二步：線性映射到 NDC

現在我們知道了底片上的投影座標 $(x_p, y_p)$，但這個座標的範圍是由視錐體的長寬決定的（例如左邊界 $l$，右邊界 $r$）。我們需要把它縮放、平移，壓縮進 NDC 的標準範圍 $[-1, 1]$ 中。

這是一個單純的線性轉換（可以想像成把一條橡皮筋拉長並對齊中心）。
以 X 軸為例，把 $[l, r]$ 映射到 $[-1, 1]$：

```math
\begin{aligned}
x_{ndc} &= \frac{2 \cdot x_p}{r - l} - \frac{r + l}{r - l}
\end{aligned}
```

把第一步得到的 $x_p$ 代入：

```math
\begin{aligned}
x_{ndc} &= \frac{2n \cdot x_e}{-z_e(r - l)} - \frac{r + l}{r - l}
\end{aligned}
```

稍微整理一下，提出分母的 $-z_e$：

```math
\begin{aligned}
x_{ndc} &= \left( \frac{2n}{r - l} \cdot x_e + \frac{r + l}{r - l} \cdot z_e \right) \div (-z_e)
\end{aligned}
```

同理，Y 軸把 $[b, t]$ 映射到 $[-1, 1]$：

```math
\begin{aligned}
y_{ndc} &= \left( \frac{2n}{t - b} \cdot y_e + \frac{t + b}{t - b} \cdot z_e \right) \div (-z_e)
\end{aligned}
```

### 第三步：矩陣與 $w$ 分量的魔法

仔細看第二步的結果，你會發現它們最後都「**除以了 $-z_e$**」。

但在線性代數的矩陣乘法中，我們無法做到「除以某個變數」這件事。該怎麼辦呢？這時候前面提到的 **透視除法 (Perspective Division)** 就派上用場了！

GPU 會在最後自動幫我們把座標除以 $w_c$。所以，投影矩陣只要做一件事：**把 $w_c$ 設定成 $-z_e$！**

觀察矩陣乘法，為了讓 $w_c = -z_e$，投影矩陣的最後一排必須是 `[0, 0, -1, 0]`：

```math
\begin{aligned}
\begin{bmatrix} x_c \\ y_c \\ z_c \\ w_c \end{bmatrix} &=
\begin{bmatrix}
\frac{2n}{r-l} & 0 & \frac{r+l}{r-l} & 0 \\
0 & \frac{2n}{t-b} & \frac{t+b}{t-b} & 0 \\
? & ? & ? & ? \\
0 & 0 & -1 & 0
\end{bmatrix}
\begin{bmatrix} x_e \\ y_e \\ z_e \\ w_e \end{bmatrix}
\end{aligned}
```

這樣一來，$w_c$ 就會剛好等於 $-z_e$。當 GPU 執行透視除法時，$x_c / w_c$ 就會完美等於我們要的 $x_{ndc}$！這就是 3D 圖學中最優雅的設計之一。

### 第四步：Z 值的非線性分佈 (Z-Fighting 的元凶)

前三步解決了 X 和 Y，那矩陣第三排的 $Z$ 該填什麼呢？
$Z$ 值在畫面上看不見，但它決定了物體的**前後遮擋關係（深度測試）**。

我們希望把視錐體中的 Z 範圍 $[-n, -f]$ 對應到 NDC 的 Z 範圍 $[-1, 1]$。
假設矩陣第三排是 $[0, 0, A, B]$，那 $z_c = A \cdot z_e + B \cdot w_e = A \cdot z_e + B$。

經過透視除法後：

```math
\begin{aligned}
z_{ndc} &= \frac{z_c}{w_c} = \frac{A \cdot z_e + B}{-z_e}
\end{aligned}
```

帶入近平面與遠平面的邊界條件：
1. 當 $z_e = -n$ 時，$z_{ndc} = -1$
2. 當 $z_e = -f$ 時，$z_{ndc} = 1$

解聯立方程式：

```math
\begin{aligned}
-A \cdot n + B &= n \\
-A \cdot f + B &= -f
\end{aligned}
```

可以得到：

```math
\begin{aligned}
A &= -\frac{f + n}{f - n}, \quad B = -\frac{2fn}{f - n}
\end{aligned}
```

**關鍵問題來了：這是一個非線性的反比例函數！**
這代表：**大部分的深度精度都被「靠近攝影機」的區域佔用了**。
- 如果你的 Near Plane ($n$) 設得太小（例如 0.0001），精度的分佈會極度不平均。
- 遠處的物體，即使距離差很遠，算出來的 $z_{ndc}$ 也可能幾乎一樣。
- 這就是導致 **Z-Fighting（遠處重疊的破圖閃爍）** 的根本原因！

### 完整的 Perspective 矩陣 (OpenGL 右手座標系)

這就是最終推導出來的投影矩陣：

```math
\begin{aligned}
P_{persp} &= \begin{bmatrix}
\dfrac{2n}{r - l} & 0 & \dfrac{r + l}{r - l} & 0 \\[6pt]
0 & \dfrac{2n}{t - b} & \dfrac{t + b}{t - b} & 0 \\[6pt]
0 & 0 & -\dfrac{f + n}{f - n} & -\dfrac{2fn}{f - n} \\[6pt]
0 & 0 & -1 & 0
\end{bmatrix}
\end{aligned}
```

---

## Orthographic Projection (正交投影)

![正交投影](images/projection_orthogonal.png)

了解了透視投影，正交投影就簡單多了。它沒有「近大遠小」的效果（攝影機沒有焦距），光線全部平行。

正交投影的視錐體原本就是一個長方體。我們只需要做兩件事：
1. **位移**：把長方體中心移到原點。
2. **縮放**：把長方體壓扁成 $[-1, 1]$ 的標準正方體。

因為沒有透視除法，所以 $w$ 分量不需要變動，保持為 $1$。矩陣最後一排是 `[0, 0, 0, 1]`。

單純的線性映射解出的矩陣如下：

```math
\begin{aligned}
P_{ortho} &= \begin{bmatrix}
\dfrac{2}{r - l} & 0 & 0 & -\dfrac{r + l}{r - l} \\[6pt]
0 & \dfrac{2}{t - b} & 0 & -\dfrac{t + b}{t - b} \\[6pt]
0 & 0 & \dfrac{-2}{f - n} & -\dfrac{f + n}{f - n} \\[6pt]
0 & 0 & 0 & 1
\end{bmatrix}
\end{aligned}
```

（$Z$ 軸一樣是單純將 $[-n, -f]$ 線性映射到 $[-1, 1]$）

---

## 總結：給初學者的效能與開發建議

基於以上的數學推導，我們在實際開發時應該注意：

1. **Near Plane 絕對不要設太小**：$0.1$ 比 $0.001$ 好非常多！因為 Z 值的非線性分佈，設得太小會直接吃掉遠處物體的深度精度，導致嚴重的 Z-Fighting。
2. **盡量縮小 Near 與 Far 的距離**：不需要畫的東西就讓 Far Plane 把它裁剪掉，這不僅能提高 Z 精度，還能減輕 GPU 負擔。
3. **透視除法是免費的**：GPU 在硬體層面 (Fixed-Function) 就會自動幫你做除以 $w$ 的動作，這比在 Shader 裡面自己用程式寫除法快多了。
4. **不要在 CPU 每一幀重算投影矩陣**：投影矩陣通常只依賴 FOV（視角大小）和 Aspect Ratio（螢幕長寬比）。除非玩家調整視窗大小或是相機焦距（例如開鏡狙擊），否則這個矩陣算好一次快取起來就好。

# 參考延伸閱讀

[OpenGL Projection Matrix - Song Ho](http://www.songho.ca/opengl/gl_projectionmatrix.html)

[Learn OpenGL - Coordinate Systems](https://learnopengl.com/Getting-started/Coordinate-Systems)

[Scratchapixel - The Perspective and Orthographic Projection Matrix](https://www.scratchapixel.com/lessons/3d-basic-rendering/perspective-and-orthographic-projection-matrix/projection-matrix-introduction.html)

[The Depth Buffer - Visualizing the Depth Buffer](https://learnopengl.com/Advanced-OpenGL/Depth-testing)
