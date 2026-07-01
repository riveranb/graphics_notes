# 圖學渲染入門 Resources

> **來源政策(2026-07-01)**:可補外部來源,不限本 repo 筆記。優先高信任來源(官方文件、公認專家、Scratchapixel / opengl-tutorial 等)。

## Knowledge

### Primary（本 repo 自有筆記，已透過 `.agent/skills/graphics_article_reviewer` 審閱）
- [遊戲數學系列](../遊戲數學_00_線性代數_矩陣.md)（`遊戲數學_00~05`）——向量、矩陣、座標空間、View/Projection Matrix、四元數旋轉。Use for: 每個座標空間轉換背後的數學，供管線類 lesson 引用。
- [遊戲繪圖系列](../遊戲繪圖_00_電腦圖學.md)（`遊戲繪圖_00~10`）——管線總覽、GPU 管線、Shader、Mesh、Texture、Blending、Lighting、Culling/Clipping、NormalMap、Depth、Shadow。Use for: 主要教材來源，逐篇對應 lessons。
- [遊戲優化 / CocosCreator優化 系列](../遊戲優化_00_Drawcall.md)——Draw Call、2D 渲染效能。**目前 out of scope**（見 MISSION.md），暫不納入 lesson 規劃。

### External（筆記中已引用、判定為高信任的來源）
- [Scratchapixel — Gentle Introduction to Computer Graphics Programming](https://www.scratchapixel.com/lessons/3d-basic-rendering/get-started/gentle-introduction-to-computer-graphics-programming.html)
  Use for: 圖學總覽，Lesson 0001 的主要推薦閱讀來源。
- [opengl-tutorial — Tutorial 3: Matrices](https://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/)
  Use for: Model/View/Projection 矩陣的實作角度說明。
- [Scratchapixel — Rasterization: a Practical Implementation](https://www.scratchapixel.com/lessons/3d-basic-rendering/rasterization-practical-implementation/rasterization-stage.html)
  Use for: 光柵化演算法細節（Edge-Function Rasterizer）。
- [電腦圖學 00: OpenGL（Medium, maochinn）](https://medium.com/maochinn/%E9%9B%BB%E8%85%A6%E5%9C%96%E5%AD%B800-opengl-fa7105f59ecd)
  Use for: 中文視角的管線總覽，補充理解。

## Wisdom (Communities)
（尚未建立——見下方 Gaps）

## Gaps
- 目前只完整挖過 `遊戲繪圖_00` 的引用來源；其餘 15 篇筆記的參考連結尚未整理進本表，會在對應 lesson 製作時補上。
- 尚未找到適合團隊新人交流圖學問題的社群（中文優先）。使用者目前也還沒表態是否需要／想加入社群，先不主動推。
