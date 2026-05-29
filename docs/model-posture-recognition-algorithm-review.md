# PostureFit 模型识别与体态算法审查文档

本文档基于当前代码实现整理，重点说明项目中“模型识别 + 姿势/体态判定”的实际工作方式。它不是旧方案复述，而是从调用链、关键点处理、角度计算、阈值分类、评分合并几个层面解释当前系统到底怎么做。

> 更新说明：本文档已同步算法风险修复后的实现。头前伸语义、缺点误判正常、侧面可见侧选择、侧面朝向估计、膝超伸、膝内扣、头部中心估计、模型规格映射与轻量质量门禁已处理；骨盆前倾仍保留为内部潜在指标，本次不进入用户报告。

代码主链路：

- `src/App.tsx`：触发图片分析、按拍摄视角保存结果、合并双视角结果。
- `src/features/pose/poseDetector.ts`：初始化 TensorFlow.js 和 BlazePose 检测器。
- `src/features/pose/usePoseDetection.ts`：把图片加载为 `HTMLImageElement`，调用模型，做有效关键点数量检查。
- `src/features/pose/normalizeKeypoints.ts`：把模型输出标准化为 BlazePose 33 点，并按拍摄模式验证关键点是否齐全。
- `src/features/analysis/angleCalculator.ts`：从 33 点计算各类体态几何指标。
- `src/features/analysis/postureClassifier.ts`：把几何指标按阈值分类为正常/轻度/中度/严重，并计算评分。
- `src/features/analysis/postureAnalyzer.ts`：串联指标计算、分类、主问题选择、单视角/双视角合并。

## 1. 总体识别链路

当前项目的识别链路可以拆成 7 步：

1. 用户拍摄或上传图片，并选择拍摄模式与视角。
2. 前端进入分析流程，读取当前照片对应的 `captureMode` 和 `view`。
3. `usePoseDetection.detectPoseFromImage` 加载图片，调用 BlazePose 模型。
4. 模型返回原始关键点数组，系统标准化为 BlazePose 33 点。
5. 系统先做“数量 + 必需关键点”校验，不通过则提示缺失部位。
6. `analyzePose` 根据视角计算指标，并只分类该视角支持的问题。
7. 双视角模式下，正面和侧面分别分析，最后合并为综合报告。

实际调用位置在 `src/App.tsx` 的 `performAnalysis`：先取 `MODE_MIN_KEYPOINTS`，再检测图片，再调用 `validateKeypointsForMode`，最后调用 `analyzePose`。双视角都完成后调用 `combineAnalyses`。

## 2. 模型层：BlazePose 33 点

当前检测器使用 `@tensorflow-models/pose-detection` 的 `SupportedModels.BlazePose`，运行时是 `tfjs`。默认使用 Full 规格，同时支持把业务模型类型映射到 tfjs 的 BlazePose 规格：`BlazePose_Lite -> lite`，`BlazePose` / `BlazePose_Full -> full`，`BlazePose_Heavy -> heavy`。

TensorFlow 初始化顺序：

1. 优先设置 `webgl` 后端。
2. 如果 WebGL 失败，尝试切到 `wasm`。
3. 检测器全局单例缓存，重复调用会复用已创建 detector。

模型输出使用的是 2D 图像关键点：

- `x`：图片坐标 x。
- `y`：图片坐标 y。
- `z`：模型可能返回，但当前分析算法基本没有使用。
- `score`：关键点置信度。

项目声明了 `worldKeypoints` 类型，但当前体态计算没有使用 3D world keypoints。所有角度和偏移都是基于单张图片的 2D 几何近似。

## 3. 关键点标准化与有效性判断

### 3.1 BlazePose 33 点映射

`normalizeBlazePoseKeypoints` 按 BlazePose 官方索引把原始数组转成带名字的 33 点数组。例如：

- `0` -> `nose`
- `7` -> `left_ear`
- `8` -> `right_ear`
- `11` -> `left_shoulder`
- `12` -> `right_shoulder`
- `23` -> `left_hip`
- `24` -> `right_hip`
- `25/26` -> 左右膝
- `27/28` -> 左右踝
- `29/30` -> 左右脚跟
- `31/32` -> 左右脚尖

如果模型没有返回完整 33 点，系统会补齐缺失点，补齐点坐标为 `(0, 0)`，`score = 0`。因此后续逻辑不能只看数组长度，必须看 `score`。

### 3.2 关键点置信度门槛

分析阶段实际使用的可见点门槛是 `score >= 0.5`：

- 角度计算的 `getPoint` 会丢弃 `score < 0.5` 的关键点。
- `validateKeypointsForMode` 也只把 `score >= 0.5` 当成有效关键点。
- 骨架绘制略宽松，`score >= 0.3` 即会画线或画点。

### 3.3 拍摄模式最低关键点数

`MODE_MIN_KEYPOINTS` 是第一层粗筛：

| 拍摄模式 | 最少有效点数 | 代码含义 |
|---|---:|---|
| `fullBody` | 12 | 全身，需要头、肩、髋、膝、踝、脚部轮廓 |
| `halfBody` | 5 | 半身，需要鼻子、双肩、双髋 |
| `closeUp` | 3 | 近景，只需要鼻子、双肩 |
| `sitting` | 7 | 坐姿，需要鼻子、双肩、双髋、双膝 |

### 3.4 必需关键点校验

第二层校验是 `validateKeypointsForMode`。它会按拍摄模式和视角检查必需点。

正面视角：

| 拍摄模式 | 必需关键点 |
|---|---|
| `fullBody` | 鼻子、左右肩、左右髋、左右膝、左右踝 |
| `halfBody` | 鼻子、左右肩、左右髋 |
| `closeUp` | 鼻子、左右肩 |
| `sitting` | 鼻子、左右肩、左右髋、左右膝 |

侧面视角：

| 拍摄模式 | 必需关键点 |
|---|---|
| `closeUp` | 同侧耳朵、同侧肩 |
| `halfBody` | 同侧肩、同侧髋 |
| `sitting` | 同侧肩、同侧髋 |
| `fullBody` | 同侧肩、同侧髋 |

侧面视角会按同侧关键点置信度选择可见侧，不再要求远侧肩/髋同时有效。正面全身照还会经过轻量质量门禁，用于拦截身体明显旋转、关键宽度过小或肩髋宽度比例异常的照片。

## 4. 姿势模块划分

项目当前从两个维度组织算法：

1. 视角模块：正面 `front`、侧面 `side`、双视角 `dual`。
2. 拍摄模式：全身、半身、近景、坐姿。

### 4.1 正面姿势模块

正面模块当前会输出 5 类问题：

- 高低肩 `shoulderImbalance`
- 骨盆侧倾 `pelvicTilt`
- 膝内扣 `kneeValgus`
- 头部偏移 `headOffset`
- 重心偏移 `centerOfGravityShift`

### 4.2 侧面姿势模块

侧面模块当前会输出 4 类问题：

- 头前伸 `forwardHead`
- 圆肩倾向 `roundedShoulder`
- 驼背风险 `hunchback`
- 膝超伸 `kneeHyperextension`

### 4.3 双视角模块

双视角不是一个独立模型，而是：

1. 正面照按正面模块分析。
2. 侧面照按侧面模块分析。
3. `combineAnalyses` 合并所有问题。
4. 按严重程度排序。
5. 选择最严重的非正常问题作为 `primaryIssue`。
6. 用高斯衰减分数计算综合分。

### 4.4 拍摄模式对问题的过滤

`MODE_ANALYZABLE_ISSUES` 会进一步过滤可分析问题：

| 拍摄模式 | 可分析问题 |
|---|---|
| `fullBody` | 正面 5 项 + 侧面 4 项 |
| `halfBody` | 高低肩、头部偏移、骨盆侧倾、头前伸、圆肩倾向 |
| `closeUp` | 高低肩、头部偏移、头前伸 |
| `sitting` | 高低肩、头部偏移、骨盆侧倾、头前伸、圆肩倾向 |

实际分类还会再叠加视角过滤。例如 `halfBody + front` 只会输出高低肩、头部偏移、骨盆侧倾；`halfBody + side` 只会输出头前伸、圆肩倾向。

## 5. 几何基础算法

项目使用三个基础几何函数：

### 5.1 三点夹角

`calculateAngle(A, B, C)` 计算以 `B` 为顶点的夹角。常用于：

- 髋-膝-踝：膝角、FPPA 近似。
- 肩中点-髋中点-膝中点：骨盆前倾近似。

### 5.2 线段相对水平线角度

`angleToHorizontal(A, B)` 使用 `atan2(y2 - y1, x2 - x1)`，返回线段与水平线的夹角。

常用于：

- 双肩连线斜率。
- 双髋连线斜率。
- 髋到肩的躯干倾斜。
- 肩到耳的头颈角近似。

### 5.3 点到线距离

`signedDistanceToLine(point, lineStart, lineEnd)` 用于计算鼻子相对躯干中线的偏移。后续会除以肩宽归一化，再乘以 45 转成角度量级。

## 6. 各体态问题算法细节

下面按体态问题逐个记录当前实现。

### 6.1 高低肩 `shoulderImbalance`

所属模块：正面。

使用关键点：

- `left_shoulder`
- `right_shoulder`

计算方式：

1. 计算左右肩连线相对水平线角度：`angleToHorizontal(left_shoulder, right_shoulder)`。
2. 转成相对水平线的最小偏离：`min(abs(angle), 180 - abs(angle))`。
3. 返回值越大，表示肩线越不水平。

阈值：

| 严重度 | 条件 |
|---|---|
| 正常 | `< 2°` |
| 轻度 | `2° <= value < 5°` |
| 中度 | `5° <= value < 12°` |
| 严重 | `>= 12°` |

缺点：

- 只看肩线斜率，不判断身体是否整体旋转。
- 缺失肩点时返回 `null`，分类器显示为未检测。

### 6.2 骨盆侧倾 `pelvicTilt`

所属模块：正面。

使用关键点：

- `left_hip`
- `right_hip`

计算方式：

1. 计算左右髋连线相对水平线角度。
2. 转成相对水平线的最小偏离。
3. 返回值越大，表示骨盆左右高度差越明显。

阈值：

| 严重度 | 条件 |
|---|---|
| 正常 | `< 2°` |
| 轻度 | `2° <= value < 5°` |
| 中度 | `5° <= value < 12°` |
| 严重 | `>= 12°` |

缺点：

- 依赖衣物下髋点识别，宽松衣物会影响很大。
- 缺失髋点时返回 `null`，分类器显示为未检测。

### 6.3 膝内扣 `kneeValgus`

所属模块：正面，全身模式才稳定。

使用关键点：

- 左侧：`left_hip`、`left_knee`、`left_ankle`
- 右侧：`right_hip`、`right_knee`、`right_ankle`

计算方式：

1. 左右腿分别计算 `angle(hip, knee, ankle)`。
2. 正常站立近似为 `180°`。
3. 对每侧计算角度偏差：`max(0, 180 - fppa)`。
4. 计算膝点到髋-踝连线的距离，用髋踝距离归一化，并乘以 45 映射成角度量级。
5. 单侧分数 = 角度偏差 + 归一化偏移分。
6. 返回左右偏差的平均值。

阈值：

| 严重度 | 条件 |
|---|---|
| 正常 | `< 5°` |
| 轻度 | `5° <= value < 10°` |
| 中度 | `10° <= value < 15°` |
| 严重 | `>= 15°` |

缺点：

- 静态正面照对动态膝内扣判断有限。
- 双腿都缺失时返回 `null`，分类器显示为未检测。

### 6.4 头部偏移 `headOffset`

所属模块：正面。

使用关键点：

- `nose`
- `left_shoulder`
- `right_shoulder`
- `left_hip`
- `right_hip`

计算方式：

1. 优先使用双耳、双眼、眼内外侧、嘴角和鼻子估计头部中心。
2. 取双肩中点 `shoulderMid`。
3. 取双髋中点 `hipMid`。
4. 把 `shoulderMid -> hipMid` 作为躯干中线。
5. 计算头部中心到躯干中线的距离。
6. 用肩宽归一化：`abs(offset) / shoulderWidth`。
7. 乘以 45，映射成角度量级。

阈值：

| 严重度 | 条件 |
|---|---|
| 正常 | `< 3°` |
| 轻度 | `3° <= value < 5°` |
| 中度 | `5° <= value < 8°` |
| 严重 | `>= 8°` |

缺点：

- 如果没有任何可用面部点，返回 `null`，分类器显示为未检测。

### 6.5 重心偏移 `centerOfGravityShift`

所属模块：正面，全身模式最合适。

使用关键点：

- `left_shoulder`
- `right_shoulder`
- `left_hip`
- `right_hip`
- `left_ankle`
- `right_ankle`

计算方式：

1. 双肩中点和双髋中点再取中点，得到 `bodyCenter`。
2. 双踝取中点，得到足部支撑中心 `ankleMid`。
3. 计算 `abs(bodyCenter.x - ankleMid.x)`。
4. 除以肩宽归一化。
5. 乘以 45 转成角度量级。

阈值：

| 严重度 | 条件 |
|---|---|
| 正常 | `< 3°` |
| 轻度 | `3° <= value < 5°` |
| 中度 | `5° <= value < 8°` |
| 严重 | `>= 8°` |

缺点：

- 这不是生物力学意义上的真实重心，只是上半身中心相对双踝中点的水平偏移。
- 侧向拍摄、镜头畸变、双脚站距都会影响结果。
- 缺失踝点时返回 `null`，分类器显示为未检测。

### 6.6 头前伸 `forwardHead`

所属模块：侧面。

使用关键点：

- 自动选择可见侧耳朵和肩点。
- 如果同侧髋点可见，会用肩-髋垂直距离作为身体高度归一化头部前移；缺髋点时降级使用耳-肩垂直距离。

当前计算方式：

1. 选择同侧可见的耳朵和肩点。
2. 使用 `atan2(abs(shoulder.y - ear.y), abs(ear.x - shoulder.x))` 计算原始近似 CVA。
3. 用侧面朝向判断耳点是否相对肩点向前移动，并计算 `headForwardRatio = forwardOffset / bodyHeight`。
4. 把前移比例转换为 CVA 等效值：`ratioCva = clamp(55 - headForwardRatio * 80, 20, 90)`。
5. 返回 `min(rawCva, ratioCva)`。数值越大越接近直立，数值越小头前伸倾向越明显。

这样可以避免明显头部前移时，因为耳-肩垂直距离较大导致原始 CVA 仍高于正常阈值而误判正常。

当前分类阈值按“实际 CVA 越大越好”：

| 严重度 | 分类函数条件 |
|---|---|
| 正常 | `angle >= 48` |
| 轻度 | `45 <= angle < 48` |
| 中度 | `40 <= angle < 45` |
| 严重 | `< 40` |

已修复风险：计算函数、分类阈值和高斯评分现在都使用实际 CVA 语义；头前伸侧面检测不再只依赖耳-肩线角度，而是融合了同侧耳-肩前移比例。正面照仍不正式输出头前伸。

### 6.7 圆肩 `roundedShoulder`

所属模块：侧面。

使用关键点：

- 自动选择可见侧肩点、髋点和可选耳点。

计算方式：

1. 用髋到肩连线计算躯干前倾角 `trunkLean`。
2. 如果耳点可用，结合侧面朝向计算耳点相对肩点的前移距离。
3. 用肩髋垂直距离 `abs(shoulder.y - hip.y)` 作为归一化身体高度。
4. `normalizedHead = headForward / bodyHeight`。
5. `normalizedTrunk = trunkLean / 45`。
6. 返回 `(0.5 * normalizedHead + 0.5 * normalizedTrunk) * 30`。

阈值：

| 严重度 | 条件 |
|---|---|
| 正常 | `< 20°` |
| 轻度 | `20° <= value < 25°` |
| 中度 | `25° <= value < 30°` |
| 严重 | `>= 30°` |

缺点：

- 该值是综合分映射成“角度量级”，不是标准临床圆肩角；用户展示文案使用“圆肩倾向”。

### 6.8 驼背倾向 `hunchback`

所属模块：侧面。

使用关键点：

- 自动选择可见侧肩点、髋点和可选耳点。

计算方式：

1. 计算躯干前倾 `trunkLean`。
2. 结合侧面朝向计算肩相对髋的前移距离。
3. 如果耳点可用，结合侧面朝向计算耳相对肩的前移距离。
4. 用肩髋垂直距离归一化。
5. 加权：`0.4 * headForwardNorm + 0.3 * shoulderForwardNorm + 0.3 * trunkLeanNorm`。
6. 乘以 20，得到最终角度量级。

阈值：

| 严重度 | 条件 |
|---|---|
| 正常 | `< 3°` |
| 轻度 | `3° <= value < 5°` |
| 中度 | `5° <= value < 8°` |
| 严重 | `>= 8°` |

缺点：

- 更像“侧面上背/头肩前移综合风险分”，不是胸椎后凸角。
- 缺少胸椎点，无法直接测量驼背角；用户展示文案使用“驼背风险”。

### 6.9 膝超伸 `kneeHyperextension`

所属模块：侧面。

使用关键点：

- 自动选择可见侧髋、膝、踝。

计算方式：

1. 计算基础膝角 `angle(hip, knee, ankle)`。
2. 根据侧面朝向判断膝点相对髋-踝线的后侧偏移。
3. 若存在后侧偏移，返回 `180 + hyperextension` 的过伸量级。
4. 若朝向不可判断，则降级返回基础膝角；关键点不足时返回 `null`。

阈值：

| 严重度 | 条件 |
|---|---|
| 正常 | `170° <= angle <= 185°` |
| 轻度 | `165° <= angle < 170°` 或 `185° < angle < 190°` |
| 中度 | `160° <= angle < 165°` 或 `190° <= angle < 195°` |
| 严重 | `< 160°` 或 `angle >= 195°` |

已修复风险：当前实现不再只依赖无符号三点夹角；关键点不足时也不会默认正常。

### 6.10 骨盆前倾 `anteriorPelvicTilt`

所属状态：有类型、有计算、有阈值、有动作库，但当前分类入口不会输出。

使用关键点：

- `left_shoulder`
- `right_shoulder`
- `left_hip`
- `right_hip`
- `left_knee`
- `right_knee`

计算方式：

1. 取肩中点、髋中点、膝中点。
2. 计算 `angle(shoulderMid, hipMid, kneeMid)`。
3. 返回 `180 - angle`。

阈值：

| 严重度 | 条件 |
|---|---|
| 正常 | `< 10°` |
| 轻度 | `10° <= value < 15°` |
| 中度 | `15° <= value < 20°` |
| 严重 | `>= 20°` |

当前不输出原因：

- `FRONT_VIEW_ISSUES` 不包含 `anteriorPelvicTilt`。
- `SIDE_VIEW_ISSUES` 也不包含 `anteriorPelvicTilt`。
- `MODE_ANALYZABLE_ISSUES.fullBody` 是正面列表 + 侧面列表，因此也不会包含它。

影响：

- 训练动作库里有骨盆前倾动作。
- 类型和阈值也支持骨盆前倾。
- 但用户当前正常流程不会看到骨盆前倾作为识别结果，也不会把它选为主要问题。

## 7. 严重度分类规则

除头前伸、膝超伸以外，多数问题使用相同模式：

```text
abs(value) < normal      -> normal
abs(value) < mild        -> mild
abs(value) < moderate    -> moderate
otherwise               -> severe
```

头前伸使用反向规则，假设输入是实际 CVA：

```text
value >= 48 -> normal
value >= 45 -> mild
value >= 40 -> moderate
else        -> severe
```

膝超伸使用范围规则：

```text
170 <= value <= 185 -> normal
value >= 165        -> mild
value >= 160        -> moderate
else                -> severe
```

未检测情况：

- 只有当指标值是 `null` 时，分类器才输出 `undetected`。
- 当前关键正面和侧面指标在所需关键点不足时都会返回 `null`。
- `undetected` 不参与主要问题选择，也不参与扣分或高斯平均。

## 8. 评分算法

单视角和双视角使用同一套阈值感知高斯评分。核心原则是：理想中心值为 100 分；从理想中心到“正常/轻度异常”边界之间开始扣分，正常边界约为 75 分；进入轻度/中度/严重异常后，继续按分段高斯曲线衰减。

### 8.1 单项评分：阈值感知高斯

`calculateIssueScore` 接收完整体态问题后，会先看严重度：

- `normal`：按“离理想中心的距离”评分，中心值为 100，正常/轻度异常边界约为 75。
- `undetected`：不参与评分平均。
- `mild` / `moderate` / `severe`：按严重度阈值分段高斯衰减，轻度/中度边界约为 50，中度/严重边界约为 20。

高斯公式仍是：

```text
score = 100 * exp(-(deviation^2) / (2 * sigma^2))
```

其中 `deviation` 会按分段语义解释：正常段使用“离理想中心的距离”，异常段使用“沿异常方向离理想中心的距离”。例如：

- 头前伸：当前 CVA 理想中心为 `50°`，正常边界为 `48°`；`50°` 附近仍是 100，`48°` 附近约为 75，低于 `48°` 后从正常/轻度边界分段衰减，`45°` 附近约为 50，`40°` 附近约为 20。
- 膝超伸：理想中心近似为 `177°`，`170°` 和 `185°` 两个正常边界约为 75；低于 170 或高于 185 后按对应方向的严重度边界继续衰减。
- 其他偏差型问题：理想中心通常是 `0°` 偏差，normal 阈值处约为 75，mild 阈值处约为 50，moderate 阈值处约为 20。

### 8.2 曲线校准

系统用每个问题已有的正常边界和严重度阈值推导分段高斯曲线：中心值为 100，正常/轻度异常边界为 75，轻度/中度异常边界为 50，中度/严重异常边界为 20。超过严重边界后继续从 20 分向下衰减。这样总分会更敏感地反映“已接近异常边界”的项目，同时仍保留高斯曲线的平滑过渡。

旧版 `GAUSSIAN_PARAMS` 仍保留给 `calculateIssueScore(type, angle)` 这种旧兼容调用使用；真实报告分数使用完整 issue 的阈值感知算法。

### 8.3 单视角和双视角聚合

`calculatePostureScoreWithNormalization` 和 `calculatePostureScore` 使用同一套聚合逻辑：

1. 每个问题单独算高斯分。
2. `undetected` 跳过。
3. 正常项按中心到正常边界的分数参与平均，范围约为 90-100。
4. 按正面/侧面分组。
5. 每组取平均。
6. 最终分数按检测项数量加权平均。

如果没有任何可评分项，分数返回 100，但问题列表仍保留未检测状态，避免把“未检测”误解释为“异常”。

## 9. 输出结果结构

单张照片分析结果 `PostureAnalysisResult` 包含：

- `keypoints`：33 点关键点。
- `metrics`：所有角度/偏移指标。
- `issues`：当前视角和拍摄模式允许输出的问题。
- `primaryIssue`：最严重的非正常问题。
- `score`：阈值感知高斯平均分。
- `view`：`front` 或 `side`。
- `analyzedAt`：分析时间。

双视角合并结果 `CombinedAnalysisResult` 包含：

- `allIssues`：所有问题，按严重度排序。
- `issuesByView.front`：正面问题。
- `issuesByView.side`：侧面问题。
- `primaryIssue`：合并后的主要问题。
- `score`：高斯综合分。
- `frontViewScore` / `sideViewScore`：各视角归一化分。
- `allScores`：所有单项高斯分。

## 10. 当前实现的风险状态

### 已修复：头前伸指标语义不一致

`calculateForwardHeadAngle` 已改为返回实际 CVA，分类和高斯评分继续使用 CVA 越大越好的规则。

### 保留限制：骨盆前倾暂不输出

当前有计算函数、类型、阈值、动作库，但不会被分类器输出。原因是 MediaPipe 没有 ASIS/PSIS，当前算法只是肩-髋-膝近似，不足以作为正式用户报告项。

### 已修复：关键点缺失时很多指标返回 0

高低肩、骨盆侧倾、膝内扣、头部偏移、重心偏移、驼背、膝超伸等在缺失关键点时返回 `null`，分类器输出 `undetected`。

### 已修复：侧面照要求左右点都可见

侧面视角改为同侧可见点校验，并通过置信度选择可见侧。

### 已修复：多项侧面指标没有判断人体朝向

圆肩倾向、驼背风险、膝超伸会优先使用自动朝向估计。朝向不可判断时，圆肩/驼背降级为无方向风险分，膝超伸降级为基础膝角或未检测。

### 已修复：膝超伸算法当前更像膝角偏小检测

膝超伸已加入有符号侧面偏移规则，能表达超过中立位的过伸风险。

### 已修复：模型配置参数没有真正生效

`createPoseDetector` 会根据 `BlazePose_Lite`、`BlazePose_Full`、`BlazePose_Heavy` 映射对应 tfjs 模型规格，默认仍为 Full。

## 11. 建议后的模块文档口径

对外产品文案建议使用：

- “体态风险筛查”
- “倾向”
- “疑似偏移”
- “建议结合自感和专业人士评估”

不建议使用：

- “医学诊断”
- “标准 CVA 异常”
- “精确骨盆前倾角”
- “真实重心”
- “胸椎后凸角”

原因是当前算法基于 2D 图像关键点近似，没有使用 C7、ASIS、PSIS、胸椎点、肩峰等临床标志点，也没有标定相机参数。

## 12. 按模块快速索引

| 模块 | 问题 | 当前是否输出 | 关键风险 |
|---|---|---:|---|
| 正面 | 高低肩 | 是 | 缺点时已返回未检测 |
| 正面 | 骨盆侧倾 | 是 | 髋点受衣物影响 |
| 正面 | 膝内扣 | 是 | FPPA + 偏移距离，仍为静态筛查 |
| 正面 | 头部偏移 | 是 | 已改用头部中心估计 |
| 正面 | 重心偏移 | 是 | 不是真实重心 |
| 侧面 | 头前伸 | 是 | 已统一为实际 CVA |
| 侧面 | 圆肩倾向 | 是 | 已加入朝向估计；仍非标准圆肩角 |
| 侧面 | 驼背风险 | 是 | 已加入朝向估计；仍无胸椎点 |
| 侧面 | 膝超伸 | 是 | 已加入有符号侧面规则 |
| 侧面/潜在 | 骨盆前倾 | 否 | 保留内部能力，暂不正式输出 |
