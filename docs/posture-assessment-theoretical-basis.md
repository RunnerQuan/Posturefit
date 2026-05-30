# 体态识别判断依据说明

本文档用于解释 PostureFit 每个体态判断为什么可以从照片关键点中推导出来，以及这些判断背后的运动科学、物理治疗和摄影测量依据。

本文档定位为“产品展示 + 学术依据”材料：它说明我们的判断不是凭空设定，但也明确边界：PostureFit 是基于 2D 图像和人体关键点的体态筛查工具，不是医学诊断、影像诊断或临床处方系统。

## 1. 总体依据

PostureFit 使用人体姿态估计模型获得鼻、耳、肩、髋、膝、踝等关键点，再用几何关系计算身体节段的相对位置。这个思路对应临床和康复研究中常见的“摄影测量法”（photogrammetry）：通过正面、侧面照片中的体表标志点，估计头颈、肩、骨盆、膝等区域的姿态偏移。

相关研究支持以下基本前提：

- 摄影测量是一种非侵入、低成本、可重复保存的姿态评估方式，适合做筛查和前后对比。
- 头颈、肩、髋、膝等体表标志点可用于构造姿态角度，例如 craniovertebral angle、肩部水平角、髋部水平角、膝关节 frontal plane projection angle。
- 2D 图像测量不能完全替代 X 光、3D 动作捕捉或临床体格检查。身体旋转、镜头透视、衣物遮挡、关键点误差都会影响结果。

因此，我们在产品中采用“风险/倾向/偏移”这样的表达，而不是直接给出疾病诊断。

## 2. 当前正式输出的问题

当前正式输出分为正面和侧面两类。

正面照主要判断左右对称和冠状面偏移：

| 体态问题 | 内部类型 | 使用关键点 | 判断直觉 |
|---|---|---|---|
| 高低肩 | `shoulderImbalance` | 左右肩 | 双肩连线越偏离水平，肩部不对称越明显 |
| 骨盆侧倾 | `pelvicTilt` | 左右髋 | 双髋连线越偏离水平，骨盆左右高度差越明显 |
| 膝内扣 | `kneeValgus` | 髋、膝、踝 | 膝盖越向髋踝连线内侧偏移，膝内扣风险越高 |
| 头部偏移 | `headOffset` | 头部中心、双肩、双髋 | 头部中心越偏离躯干中线，头颈左右偏移越明显 |
| 重心偏移 | `centerOfGravityShift` | 双肩、双髋、双踝 | 躯干中心越偏离双踝支撑中心，整体站姿偏移越明显 |

侧面照主要判断矢状面姿态：

| 体态问题 | 内部类型 | 使用关键点 | 判断直觉 |
|---|---|---|---|
| 头前伸 | `forwardHead` | 同侧耳、肩，优先加髋 | 耳朵相对肩越向前，CVA 越小，头前伸越明显 |
| 圆肩倾向 | `roundedShoulder` | 同侧肩、髋，优先加耳 | 肩相对髋/躯干越前移，圆肩倾向越明显 |
| 驼背风险 | `hunchback` | 同侧耳、肩、髋 | 头前移、肩前移和躯干前倾共同升高驼背风险 |
| 膝超伸 | `kneeHyperextension` | 同侧髋、膝、踝 | 膝点相对髋踝连线向后偏，膝关节角超过正常伸直范围 |

骨盆前倾 `anteriorPelvicTilt` 在代码中保留辅助计算，但当前不作为正式用户报告输出。原因是可靠判断骨盆前倾通常需要 ASIS/PSIS 等骨盆标志点，普通 2D 图片和 BlazePose 关键点不足以给出足够可靠的正式结论。

## 3. 分项理论依据

### 3.1 高低肩

**我们判断什么**

高低肩判断左右肩部是否在同一水平线上。系统计算左肩和右肩连线相对水平线的夹角，角度越大，表示左右肩高度差越明显。

**为什么有依据**

摄影测量研究通常会用肩峰、肩部水平线、coronal shoulder angle 或 acromion alignment 来表示正面肩部对称性。上半身体态摄影测量综述指出，冠状面肩角可反映左右肩对称性；近年的手机/图像姿态评估综述也报告了肩峰对齐等指标在图像评估中的可靠性证据。[1][8][12]

**项目实现**

- 使用关键点：`left_shoulder`、`right_shoulder`
- 计算方式：双肩连线与水平线夹角
- 当前阈值：`<2°` 正常，`2°-5°` 轻度，`5°-12°` 中度，`>=12°` 严重

**限制**

肩部高度受拍摄角度、身体旋转、单侧耸肩、衣服厚度影响。它适合提示“肩部不对称”，不能单独判断脊柱侧弯、肩胛异常或长短腿。

### 3.2 骨盆侧倾

**我们判断什么**

骨盆侧倾判断左右髋部是否在同一水平线上。系统计算左髋和右髋连线相对水平线的夹角。

**为什么有依据**

正面姿态评估常使用髂嵴、ASIS/PSIS 或髋部标志点比较骨盆左右高度。2D/手机姿态评估研究中也常包含 hip tilt 或 pelvic tilt，用来描述骨盆在冠状面的左右倾斜。相关综述显示，髋部倾斜等图像指标可作为姿态筛查指标，但不同应用和标记方式的可靠性存在差异。[8][9][12]

**项目实现**

- 使用关键点：`left_hip`、`right_hip`
- 计算方式：双髋连线与水平线夹角
- 当前阈值：`<2°` 正常，`2°-5°` 轻度，`5°-12°` 中度，`>=12°` 严重

**限制**

BlazePose 的髋点不是 ASIS/PSIS 临床骨性标志点，因此本项更准确地说是“2D 髋部水平偏移近似”。它不能替代骨盆临床检查，也不能判断真实骨盆旋转。

### 3.3 膝内扣

**我们判断什么**

膝内扣判断正面照中膝盖是否相对髋和踝向内偏移。系统结合两类信息：髋-膝-踝形成的 FPPA 角度，以及膝点到髋踝连线的归一化距离。

**为什么有依据**

FPPA 是临床和运动科学中常用的 2D 膝内扣/动态膝外翻评估指标。研究表明 FPPA 可用于 2D 视频中的膝外翻筛查，并在某些动作任务中有可靠性；同时也有研究提醒，2D FPPA 并不等同于 3D 膝关节外翻，因为它会混合髋、膝、胫骨旋转和投影误差。[5][6][7]

**项目实现**

- 使用关键点：左右髋、左右膝、左右踝
- 计算方式：平均左右腿的 FPPA 偏差，并叠加膝点到髋踝线的归一化偏移
- 当前阈值：`<5°` 正常，`5°-10°` 轻度，`10°-15°` 中度，`>=15°` 严重

**限制**

本项更适合提示“正面膝内扣风险”。静态站姿照片不能完全代表下蹲、跳落地、跑步中的动态膝内扣风险。

### 3.4 头部偏移

**我们判断什么**

头部偏移判断正面照中头部中心是否偏离躯干中线。系统优先用双耳、双眼和鼻子估计头部中心，再比较它与肩髋中线的距离。

**为什么有依据**

图像姿态评估中常使用 head tilt、head shift、coronal head angle 等指标描述头部在冠状面的偏移。上半身体态摄影测量综述指出，冠状面头部倾斜和肩部角度可用于描述正面姿态对称性；手机姿态评估综述也将头部、肩部、髋部对齐列为常见图像姿态变量。[1][8][12]

**项目实现**

- 使用关键点：头部中心、左右肩、左右髋
- 计算方式：头部中心到肩-髋躯干中线的距离，用肩宽归一化后转换为角度量级
- 当前阈值：`<3°` 正常，`3°-5°` 轻度，`5°-8°` 中度，`>=8°` 严重

**限制**

正面头部偏移不等于颈椎旋转或斜颈诊断。用户转头、歪头看镜头、刘海遮挡耳眼都会影响计算。

### 3.5 重心偏移

**我们判断什么**

重心偏移判断正面照中躯干中心是否偏离双踝支撑中心。系统用肩中点和髋中点估计躯干中心，用双踝中点估计支撑中心。

**为什么有依据**

姿态评估中常使用身体重心或重心投影相对支撑面的关系来描述平衡和站姿偏移。摄影测量研究也有针对重心投影到支撑基底的可靠性探索。但严格意义上，真实重心需要力台、压力板或更完整的人体质量模型，而不是单张 2D 照片。[10][12]

**项目实现**

- 使用关键点：左右肩、左右髋、左右踝
- 计算方式：躯干中心与双踝中心的水平距离，用肩宽归一化后转换为角度量级
- 当前阈值：`<3°` 正常，`3°-5°` 轻度，`5°-8°` 中度，`>=8°` 严重

**限制**

“重心偏移”在产品中保留这个名称，但文档口径必须说明：它是 2D 图像近似，不是真实生物力学重心测量。

### 3.6 头前伸

**我们判断什么**

头前伸判断侧面照中头部是否位于肩部前方。系统以 CVA（craniovertebral angle）为核心：耳-肩连线与水平线形成的角越小，头越前伸。

**为什么有依据**

CVA 是非放射性头前伸评估中最常用的指标之一。关于头前伸测量的系统综述显示，CVA 等非放射方法被广泛用于评估 forward head posture，并有可靠性/效度研究支持。头前伸、圆肩和胸椎后凸之间也常被作为相关的上交叉/上半身体态问题讨论。[2][3][4][11]

**项目实现**

- 使用关键点：同侧耳、同侧肩；有髋点时用肩髋高度辅助归一化
- 计算方式：raw CVA + 头部前移比例融合，取更保守的异常值
- 当前阈值：`>=48°` 正常，`45°-48°` 轻度，`40°-45°` 中度，`<40°` 严重
- 评分中心：`50°` 附近最理想

**限制**

不同研究对 CVA 边界并不完全一致，且 CVA 与疼痛并非一一对应。PostureFit 的阈值是筛查阈值和产品校准，不是医学诊断标准。

### 3.7 圆肩倾向

**我们判断什么**

圆肩倾向判断侧面照中肩部是否相对髋部/躯干向前。系统结合肩-髋线的前倾和耳-肩前移来估计肩颈前卷倾向。

**为什么有依据**

摄影测量研究常用 sagittal shoulder-C7 angle、肩峰相对躯干的位置或肩部前移来描述 rounded shoulder。上半身体态综述认为，头前伸、圆肩和胸椎后凸常在姿态研究中一起讨论；摄影测量角度可为这些外观姿态提供可重复的量化方式。[1][4][8]

**项目实现**

- 使用关键点：同侧肩、同侧髋；有耳点时加入头部前移
- 计算方式：肩髋线相对垂直线的偏离 + 头部前移归一化
- 当前阈值：`<20°` 正常，`20°-25°` 轻度，`25°-30°` 中度，`>=30°` 严重

**限制**

圆肩涉及肩胛骨位置、胸椎形态、胸小肌/背部肌群状态等，单张侧面照只能估计“外观上的前卷倾向”。

### 3.8 驼背风险

**我们判断什么**

驼背风险判断侧面照中是否同时出现头前移、肩前移和躯干前倾。系统不是直接测胸椎 Cobb 角，而是用可见关键点构造一个风险综合分。

**为什么有依据**

胸椎后凸、头前伸和圆肩在文献中常被联合作为上半身体态异常讨论。摄影测量可用 thoracic kyphosis angle、肩部角度、CVA 等指标描述外观姿态，但胸椎真实曲度更适合用临床量表、倾角仪或影像学检查确认。[1][4][8]

**项目实现**

- 使用关键点：同侧耳、肩、髋
- 计算方式：`0.4 * 头前移 + 0.3 * 肩前移 + 0.3 * 躯干前倾`
- 当前阈值：`<3°` 正常，`3°-5°` 轻度，`5°-8°` 中度，`>=8°` 严重

**限制**

这项应展示为“驼背风险/倾向”，不能写成“诊断驼背”。单张照片不能测量胸椎真实后凸角。

### 3.9 膝超伸

**我们判断什么**

膝超伸判断侧面照中膝关节是否超过正常伸直范围。系统计算髋-膝-踝角，并结合膝点相对髋踝线的前后方向判断是否向后顶出。

**为什么有依据**

膝超伸（genu recurvatum）通常指膝关节伸展超过中立位。摄影测量研究已将膝超伸、CVA、swayback 等姿态变量作为侧面照评估对象，并探索其观察者内和观察者间可靠性。静态照片中的髋-膝-踝角能提供筛查线索，但不等同于关节活动度测量。[11]

**项目实现**

- 使用关键点：同侧髋、膝、踝
- 计算方式：髋-膝-踝角 + 基于侧面朝向的有符号膝点偏移
- 当前阈值：`170°-185°` 正常；低于 `170°` 或高于 `185°` 开始异常；超过边界越多，风险越高

**限制**

站姿、鞋跟高度、膝关节松弛度、镜头角度都会影响结果。它适合提示“疑似膝超伸”，不是关节松弛、韧带问题或神经肌肉控制问题的诊断。

## 4. 阈值和评分依据

PostureFit 的阈值分两类：

1. 来自常见姿态测量指标的方向性依据，例如 CVA 越小越提示头前伸，FPPA 偏差越大越提示膝内扣。
2. 来自产品校准的风险边界，例如轻度、中度、严重分层和综合评分曲线。

当前评分采用阈值感知高斯衰减：

- 中立值到“中立值-正常边界”的中点保持 100 分。
- 从该中点到正常/轻度异常边界，从 100 分平滑衰减到约 90 分。
- 轻度/中度边界约 50 分。
- 中度/严重边界约 20 分。
- 未检测项不参与平均。

这个评分设计的产品含义是：整体分数表达“当前照片中已检测体态项的总体风险”，不是医学严重程度，也不是运动能力评分。

## 5. 对外展示建议

推荐在产品或路演中使用以下话术：

> 我们不是用 AI 主观判断“好看不好看”，而是先定位人体关键点，再参考康复和运动科学中常用的摄影测量指标，例如头前伸的 CVA、膝内扣的 FPPA、肩髋水平线和髋膝踝角。系统会把这些指标转化为可解释的风险提示，同时保留 2D 图片筛查的边界：它适合帮助用户发现姿态倾向和改善方向，不替代医生、康复师或影像检查。

## 6. 参考来源

1. Singla D, Veqar Z. **Photogrammetric Assessment of Upper Body Posture Using Postural Angles: A Literature Review.** Journal of Chiropractic Medicine, 2017. https://pmc.ncbi.nlm.nih.gov/articles/PMC5446097/
2. Sheikhhoseini R, et al. **Reliability and Validity of Non-radiographic Methods of Forward Head Posture Measurement: A Systematic Review.** Journal of Manipulative and Physiological Therapeutics, 2022. https://pubmed.ncbi.nlm.nih.gov/35935117/
3. Mahmoud NF, et al. **The Relationship Between Forward Head Posture and Neck Pain: a Systematic Review and Meta-Analysis.** Current Reviews in Musculoskeletal Medicine, 2019. https://pmc.ncbi.nlm.nih.gov/articles/PMC6942109/
4. Singla D, Veqar Z. **Association Between Forward Head, Rounded Shoulders, and Increased Thoracic Kyphosis: A Review of the Literature.** Journal of Chiropractic Medicine, 2017. https://pmc.ncbi.nlm.nih.gov/articles/PMC5659804/
5. Straub RK, Powers CM. **Does the 2D Frontal Plane Projection Angle Predict Frontal Plane Knee Moments during Stepping, Landing, and Change of Direction Tasks?** International Journal of Sports Physical Therapy, 2022. https://pmc.ncbi.nlm.nih.gov/articles/PMC9718689/
6. King E, et al. **Concurrent Validity and Reliability of Two-dimensional Frontal Plane Knee Measurements during Multi-directional Cutting Maneuvers.** International Journal of Sports Physical Therapy, 2022. https://pmc.ncbi.nlm.nih.gov/articles/PMC8805110/
7. Whatman C, et al. **Reliability and Validity of Observational Risk Screening in Evaluating Dynamic Knee Valgus.** Journal of Athletic Training, 2013. https://pmc.ncbi.nlm.nih.gov/articles/PMC3525653/
8. Bittencourt NFN, et al. **Photogrammetry-based smartphone applications for spinal posture assessment: a systematic review and meta-analysis.** Scientific Reports, 2025. https://pmc.ncbi.nlm.nih.gov/articles/PMC12827935/
9. Ferreira EAG, et al. **Reference Values for Human Posture Measurements Based on Computerized Photogrammetry: A Systematic Review.** Journal of Manipulative and Physiological Therapeutics, 2017. https://pubmed.ncbi.nlm.nih.gov/28069258/
10. De Oliveira JMR, et al. **Intra and inter-rater reliability of the projection of the body’s center of mass obtained via photogrammetry.** Fisioterapia e Pesquisa, 2017. https://revistas.usp.br/fpusp/article/view/143459
11. Badr NM, et al. **Reliability of photogrammetric evaluation of the craniovertebral angle, swayback posture, and knee hyperextension in university students.** 2025. https://pmc.ncbi.nlm.nih.gov/articles/PMC11957747/
12. Lee HJ, et al. **Validity and Reliability of Standing Posture Measurements Using a Mobile Application.** Journal of Manipulative and Physiological Therapeutics, 2019. https://pubmed.ncbi.nlm.nih.gov/31000345/

[8]: 
