# 使用 MediaPipe BlazePose 替代 MoveNet 进行体态识别的技术规格文档

> 版本：v1.0  
> 适用场景：基于用户上传的正面照、侧面照、动作照，对常见体态问题进行自动化筛查与风险提示。  
> 核心目标：将原 MoveNet 17 点替换为 MediaPipe BlazePose / Pose Landmarker 33 点，并基于专业姿势摄影测量（photogrammetry）方法设计关键点角度计算方案。

---

## 1. 替换结论

建议使用 **MediaPipe Pose Landmarker / BlazePose 33 点** 替代 MoveNet 17 点。

原因：

1. MediaPipe Pose Landmarker 可在图片或视频中检测人体姿态关键点，并输出 **image coordinates** 与 **3D world coordinates**。
2. BlazePose 相比 MoveNet 17 点增加了脚跟、脚尖、更多面部点和手部点，对体态评估中的头部偏移、身体前后倾、膝超伸、支撑中心估算更有帮助。
3. 但 MediaPipe 33 点仍不是临床解剖标志点模型，它没有明确输出：
   - C7 棘突
   - ASIS 髂前上棘
   - PSIS 髂后上棘
   - 胸椎点 T1/T12
   - 肩胛骨点
   - 精确肩峰 acromion

因此，本系统应定位为：

> 基于单张/多张照片的体态风险筛查工具，而不是医学诊断工具。

---

## 2. 专业依据概述

### 2.1 MediaPipe / BlazePose 依据

MediaPipe Pose Landmarker 官方文档说明，该任务可识别图片或视频中的人体关键点，用于分析姿态和分类动作，并输出 2D 图像坐标与 3D world coordinates。

Google MediaPipe Pose / BlazePose 文档说明，其 landmark model 可预测 **33 个身体姿态关键点**。

参考资料：

- Google AI Edge, Pose Landmarker: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
- MediaPipe Pose Docs: https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/pose.md
- Google Research Blog, BlazePose: https://research.google/blog/on-device-real-time-body-pose-tracking-with-mediapipe-blazepose/

### 2.2 姿势摄影测量依据

体态评估中，使用照片测量人体关键点角度的方法通常称为：

- photogrammetry
- computerized photogrammetry
- biophotogrammetry
- photographic posture analysis

相关研究表明，照片姿态评估可以用于测量身体角度和距离，但结果受拍摄标准、标志点定义、关键点标注一致性影响。因此，在产品中应使用“倾向”“风险”“筛查结果”等表述。

参考资料：

- Photogrammetric Assessment of Upper Body Posture Using Postural Angles: https://pmc.ncbi.nlm.nih.gov/articles/PMC5446097/
- Photogrammetry as a tool for the postural evaluation of the spine: https://pmc.ncbi.nlm.nih.gov/articles/PMC4757659/
- Reliability and validity of angular measures through the Postural Assessment Software: https://www.sciencedirect.com/science/article/abs/pii/S0048712013000832

---

## 3. MediaPipe BlazePose 33 点列表

MediaPipe Pose 33 个关键点如下：

| ID | Landmark |
|---:|---|
| 0 | nose |
| 1 | left_eye_inner |
| 2 | left_eye |
| 3 | left_eye_outer |
| 4 | right_eye_inner |
| 5 | right_eye |
| 6 | right_eye_outer |
| 7 | left_ear |
| 8 | right_ear |
| 9 | mouth_left |
| 10 | mouth_right |
| 11 | left_shoulder |
| 12 | right_shoulder |
| 13 | left_elbow |
| 14 | right_elbow |
| 15 | left_wrist |
| 16 | right_wrist |
| 17 | left_pinky |
| 18 | right_pinky |
| 19 | left_index |
| 20 | right_index |
| 21 | left_thumb |
| 22 | right_thumb |
| 23 | left_hip |
| 24 | right_hip |
| 25 | left_knee |
| 26 | right_knee |
| 27 | left_ankle |
| 28 | right_ankle |
| 29 | left_heel |
| 30 | right_heel |
| 31 | left_foot_index |
| 32 | right_foot_index |

---

## 4. 基础几何计算方法

### 4.1 三点夹角

设三个点：

```text
A(x1, y1), B(x2, y2), C(x3, y3)
```

计算以 B 为顶点的夹角：

```text
v1 = A - B
v2 = C - B

angle = arccos( dot(v1, v2) / (|v1| * |v2|) )
angle_deg = angle * 180 / π
```

常用于：

```text
angle(hip, knee, ankle)
angle(shoulder, hip, knee)
angle(ear, shoulder, hip)
```

### 4.2 线段相对水平线角度

```text
angle_to_horizontal = atan2(y2 - y1, x2 - x1) * 180 / π
```

常用于：

```text
shoulder_slope = angle(left_shoulder -> right_shoulder)
pelvic_slope = angle(left_hip -> right_hip)
head_tilt = angle(left_ear -> right_ear)
```

### 4.3 线段相对垂直线角度

```text
angle_to_vertical = 90° - abs(angle_to_horizontal)
```

或直接计算线段与垂直向量的夹角。

常用于：

```text
trunk_lean = angle(vertical, hip -> shoulder)
body_lean = angle(vertical, foot_center -> shoulder)
```

### 4.4 点到线距离

用于计算头部偏移、膝内扣、重心偏移。

```text
line = point1 -> point2
offset = signed_distance(point, line)
offset_norm = offset / reference_length
```

推荐对距离做归一化，避免受拍摄距离影响：

```text
head_offset_norm = head_offset / shoulder_width
knee_offset_norm = knee_offset / leg_length
cog_offset_norm = cog_offset / shoulder_width
```

---

## 5. 输入照片规范

### 5.1 正面照

用于：

- 高低肩
- 骨盆侧倾
- 膝内扣静态筛查
- 头部偏移
- 左右重心偏移

拍摄要求：

1. 人站直，双脚自然与肩同宽。
2. 相机与胸口高度大致平齐。
3. 人体正对相机，避免身体旋转。
4. 全身入镜，至少包含头、肩、髋、膝、踝、脚部。
5. 穿贴身衣物，避免宽松衣物遮挡肩/髋/膝。

### 5.2 侧面照

用于：

- 头前伸
- 圆肩
- 骨盆前倾补点模式
- 重心前后偏移
- 驼背倾向
- 膝超伸

拍摄要求：

1. 人体侧面对相机。
2. 耳、肩、髋、膝、踝、足部尽量在同一侧清晰可见。
3. 避免身体斜转。
4. 全身入镜。
5. 若要评估骨盆前倾，建议用户手动点选 ASIS/PSIS。

### 5.3 动作照 / 视频帧

用于：

- 膝内扣 / 动态膝外翻
- 深蹲动作中的膝轨迹
- 单腿下蹲中的膝控制能力

推荐动作：

1. 正面深蹲最低点
2. 正面单腿下蹲
3. 正面台阶下落 / step-down
4. 正面跳落地瞬间

---

## 6. 体态问题计算方式

---

# 6.1 头前伸 Forward Head Posture

## 专业依据

临床和姿势摄影测量中，头前伸常用 **Craniovertebral Angle, CVA，颅椎角** 表示。标准 CVA 定义为：

```text
CVA = angle(horizontal line through C7, C7 -> tragus/ear)
```

CVA 越小，头前伸越明显。许多研究和临床资料使用约 48°–50° 作为头前伸参考阈值，但不同研究阈值并不完全一致。

参考资料：

- Craniovertebral angle explanation: https://www.physio-pedia.com/Craniovertebral_angle
- Forward head posture with CVA < 50° example: https://www.mdpi.com/2077-0383/12/2/542
- Upper body posture photogrammetry review: https://pmc.ncbi.nlm.nih.gov/articles/PMC5446097/

## MediaPipe 可用关键点

MediaPipe 没有 C7，所以不能直接计算标准 CVA。

可用近似点：

| 临床点 | MediaPipe 替代点 |
|---|---|
| tragus / ear | left_ear 或 right_ear |
| C7 | neck_base 近似点 |
| shoulder | left_shoulder 或 right_shoulder |

构造：

```text
neck_base ≈ midpoint(left_shoulder, right_shoulder)
```

侧面照中，若左右肩重叠，可使用可见侧肩点：

```text
visible_shoulder = left_shoulder or right_shoulder
visible_ear = left_ear or right_ear
```

## 计算方式 A：头前伸近似角

```text
FHP_angle = angle_between(
    horizontal_line,
    vector(visible_shoulder -> visible_ear)
)
```

## 计算方式 B：耳点相对肩点前移距离

```text
head_forward_offset = visible_ear.x - visible_shoulder.x
head_forward_offset_norm = head_forward_offset / distance(visible_shoulder, visible_hip)
```

注意：需要根据人体朝向判断 x 正方向。如果用户朝左，符号需要反转。

## 角度关系

```text
FHP_angle 越小，头前伸倾向越明显
ear 相对 shoulder 越向前，头前伸倾向越明显
```

## 推荐输出

```text
头前伸倾向 / 头颈前移风险
```

不要写：

```text
标准 CVA 异常
```

除非用户手动补点 C7。

## 可靠性等级

中等。

原因：有 ear 和 shoulder，但缺 C7。

## 专业增强方案

增加手动补点：

```text
用户点击 C7
系统使用 C7 + ear 计算标准 CVA
```

---

# 6.2 圆肩 Rounded Shoulder / Forward Shoulder Posture

## 专业依据

圆肩/肩前引在摄影测量中常通过 **C7、肩峰 acromion、水平线/垂直线** 形成的肩部角度进行评估，例如 sagittal shoulder-C7 angle、forward shoulder angle 等。上半身姿势摄影测量综述指出，头颈肩相关角度可作为上半身姿势评估指标，但不同研究的角度定义和阈值存在差异。

参考资料：

- Photogrammetric Assessment of Upper Body Posture Using Postural Angles: https://pmc.ncbi.nlm.nih.gov/articles/PMC5446097/

## MediaPipe 可用关键点

MediaPipe 没有 C7，也没有明确的肩峰 acromion，但 shoulder 点可近似肩峰区域。

可用点：

```text
visible_shoulder
visible_hip
visible_ear
```

## 计算方式 A：肩点相对髋点前移

```text
shoulder_forward_offset = visible_shoulder.x - visible_hip.x
shoulder_forward_offset_norm = shoulder_forward_offset / distance(visible_shoulder, visible_hip)
```

## 计算方式 B：躯干前倾角

```text
trunk_lean = angle_between(
    vertical_line,
    vector(visible_hip -> visible_shoulder)
)
```

## 计算方式 C：联合头前伸

```text
round_shoulder_score =
    0.5 * normalized(shoulder_forward_offset_norm)
  + 0.3 * normalized(trunk_lean)
  + 0.2 * normalized(head_forward_offset_norm)
```

## 关系

```text
shoulder 相对 hip 越向前
+ trunk_lean 越大
+ head_forward_offset 越大
=> 圆肩/肩前引倾向越明显
```

## 推荐输出

```text
圆肩倾向 / 肩前引风险
```

## 可靠性等级

中等偏低。

原因：MediaPipe 肩点可用，但缺 C7 和精确肩峰点，因此建议联合头前伸、躯干前倾综合判断。

## 专业增强方案

用户手动点选：

```text
C7
肩峰 acromion
```

然后计算：

```text
shoulder_C7_angle = angle(horizontal, C7 -> acromion)
```

---

# 6.3 骨盆前倾 Anterior Pelvic Tilt

## 专业依据

临床上，骨盆前倾通常通过观察或测量 **ASIS 髂前上棘** 与 **PSIS 髂后上棘** 的相对位置判断：

```text
ASIS 低于 PSIS => 骨盆前倾
ASIS 高于 PSIS => 骨盆后倾
```

侧面观察时，ASIS-PSIS 连线相对水平线的角度可作为骨盆倾斜角。文献也指出，这类测量依赖骨性标志点触诊或标注，且方法可靠性/有效性存在争议，因此不宜仅靠普通 pose 关键点强判断。

参考资料：

- Clinical Measures of Pelvic Tilt in Physical Therapy: https://pmc.ncbi.nlm.nih.gov/articles/PMC8486407/
- Clinical Measures of Pelvic Tilt in Physical Therapy, IJSpt: https://ijspt.scholasticahq.com/article/27978-clinical-measures-of-pelvic-tilt-in-physical-therapy

## MediaPipe 可用关键点

MediaPipe 只有：

```text
left_hip
right_hip
```

没有：

```text
ASIS
PSIS
```

因此不能直接计算专业骨盆前倾角。

## 自动模式：不建议强判断

可计算弱代理指标：

```text
hip_angle = angle(shoulder, hip, knee)
trunk_lean = angle(vertical, hip -> shoulder)
thigh_angle = angle(vertical, knee -> hip)
```

这些只能提示：

```text
疑似骨盆姿态异常
```

不能直接等同于骨盆前倾。

## 专业补点模式：推荐实现

要求用户在侧面照上手动点击：

```text
ASIS
PSIS
```

然后计算：

```text
pelvic_tilt_angle = angle_between(
    horizontal_line,
    vector(PSIS -> ASIS)
)
```

图像坐标中通常 y 向下：

```text
if ASIS.y > PSIS.y:
    ASIS 更低，骨盆前倾方向
elif ASIS.y < PSIS.y:
    ASIS 更高，骨盆后倾方向
```

## 关系

```text
ASIS 相对 PSIS 越低
=> 骨盆前倾越明显

ASIS 相对 PSIS 越高
=> 骨盆后倾越明显
```

## 推荐输出

自动模式：

```text
骨盆姿态异常风险
```

补点模式：

```text
骨盆前倾倾向 / 骨盆后倾倾向
```

## 可靠性等级

自动模式：低。  
补点模式：中高。

---

# 6.4 高低肩 Shoulder Height Asymmetry

## 专业依据

摄影测量和 SAPO/PAS 类姿势评估中，左右肩部标志点水平差异和肩线倾斜是常用的姿势不对称指标。通过左右肩点连线相对水平线的角度，可以量化高低肩风险。

参考资料：

- Reliability and validity of angular measures through PAS: https://www.sciencedirect.com/science/article/abs/pii/S0048712013000832
- Photographic posture analysis reliability: https://avesis.gazi.edu.tr/yayin/c244b889-23af-444c-8ff0-a67624a59a12/reliability-of-photographic-posture-analysis-of-adolescents/document.pdf

## MediaPipe 可用关键点

```text
left_shoulder
right_shoulder
```

## 计算方式

```text
shoulder_slope = atan2(
    right_shoulder.y - left_shoulder.y,
    right_shoulder.x - left_shoulder.x
) * 180 / π
```

也可计算高度差：

```text
shoulder_height_diff = abs(left_shoulder.y - right_shoulder.y)
shoulder_height_diff_norm = shoulder_height_diff / shoulder_width
```

其中：

```text
shoulder_width = distance(left_shoulder, right_shoulder)
```

## 关系

```text
abs(shoulder_slope) 越大
=> 高低肩越明显
```

判断哪侧更高：

```text
if left_shoulder.y < right_shoulder.y:
    左肩更高
else:
    右肩更高
```

注：图像坐标中 y 越小，位置越高。

## 建议阈值

```text
abs(shoulder_slope) < 2°：基本对称
2° <= abs(shoulder_slope) < 5°：轻度高低肩倾向
abs(shoulder_slope) >= 5°：明显高低肩风险
```

阈值为工程初始值，需要后续用真实样本校准。

## 可靠性等级

高。

---

# 6.5 骨盆侧倾 Pelvic Obliquity / Pelvic Lateral Tilt

## 专业依据

骨盆侧倾通常通过正面或背面观察左右骨盆标志点的高度差判断。专业上更理想的标志点是左右 ASIS 或 PSIS。MediaPipe 不能直接识别 ASIS/PSIS，但左右 hip 点可作为髋部水平线近似。

参考资料：

- Postural Assessment Software and photogrammetry reliability: https://www.sciencedirect.com/science/article/abs/pii/S0048712013000832

## MediaPipe 可用关键点

```text
left_hip
right_hip
```

## 计算方式

```text
pelvic_slope = atan2(
    right_hip.y - left_hip.y,
    right_hip.x - left_hip.x
) * 180 / π
```

归一化高度差：

```text
pelvic_height_diff = abs(left_hip.y - right_hip.y)
pelvic_height_diff_norm = pelvic_height_diff / hip_width
```

其中：

```text
hip_width = distance(left_hip, right_hip)
```

## 关系

```text
abs(pelvic_slope) 越大
=> 骨盆/髋部侧倾越明显
```

判断哪侧更高：

```text
if left_hip.y < right_hip.y:
    左侧髋/骨盆更高
else:
    右侧髋/骨盆更高
```

## 推荐输出

```text
骨盆侧倾倾向
```

更严谨：

```text
髋部水平线倾斜，提示骨盆侧倾风险
```

## 建议阈值

```text
abs(pelvic_slope) < 2°：基本对称
2° <= abs(pelvic_slope) < 5°：轻度骨盆侧倾倾向
abs(pelvic_slope) >= 5°：明显骨盆侧倾风险
```

## 可靠性等级

中等。

原因：MediaPipe hip 不是 ASIS/PSIS，只能近似骨盆水平线。

---

# 6.6 膝内扣 Knee Valgus / Dynamic Knee Valgus

## 专业依据

膝内扣 / 动态膝外翻常用 **FPPA, Frontal Plane Projection Angle，额状面投影角** 进行 2D 评估。FPPA 使用正面图像中的髋、膝、踝三点计算，常用于深蹲、单腿下蹲、落地、跑步、变向等任务。文献指出，2D FPPA 方法在临床和运动筛查中成本低、易部署，并在一些任务中具有良好可靠性。

参考资料：

- Concurrent Validity and Reliability of 2D Frontal Plane Knee Measurements: https://ijspt.scholasticahq.com/article/31651-concurrent-validity-and-reliability-of-two-dimensional-frontal-plane-knee-measurements-during-multi-directional-cutting-maneuvers
- Reliability of Frontal Plane Knee Alignment Measurement: https://pmc.ncbi.nlm.nih.gov/articles/PMC10681043/
- FPPA and knee valgus discussion: https://pmc.ncbi.nlm.nih.gov/articles/PMC9718689/

## MediaPipe 可用关键点

左腿：

```text
left_hip
left_knee
left_ankle
```

右腿：

```text
right_hip
right_knee
right_ankle
```

## 计算方式 A：FPPA

```text
FPPA_left = angle(left_hip, left_knee, left_ankle)
FPPA_right = angle(right_hip, right_knee, right_ankle)
```

注意：单纯三点夹角需要结合方向判断，不能只看角度大小。

## 计算方式 B：膝点相对髋踝线的内移距离

```text
hip_ankle_line = line(hip, ankle)
knee_offset = signed_distance(knee, hip_ankle_line)
knee_offset_norm = knee_offset / distance(hip, ankle)
```

方向判断：

```text
left_knee 向身体中线 / 图像右侧偏移 => 左膝内扣
right_knee 向身体中线 / 图像左侧偏移 => 右膝内扣
```

更稳的方法：

```text
body_midline = line(midpoint(left_shoulder, right_shoulder), midpoint(left_hip, right_hip))
判断 knee 是否向 body_midline 方向偏移
```

## 推荐场景

```text
静态正面站立照：只输出“静态膝对线异常”
正面深蹲最低点：输出“动态膝内扣风险”
单腿下蹲：输出“单侧动态膝控制风险”
```

## 推荐输出

```text
膝内扣倾向 / 动态膝外翻风险
```

## 可靠性等级

高，前提是使用动作照或视频帧。

---

# 6.7 头部偏移 Head Tilt / Head Translation

## 专业依据

正面姿势摄影测量中，头部侧倾和头部相对身体中线偏移可用于评估头颈姿势不对称。通常使用双眼/双耳连线相对水平线角度，以及头中心相对肩髋中线的偏移量。

参考资料：

- Photogrammetric Assessment of Upper Body Posture Using Postural Angles: https://pmc.ncbi.nlm.nih.gov/articles/PMC5446097/

## MediaPipe 可用关键点

```text
left_ear
right_ear
left_eye
right_eye
nose
left_shoulder
right_shoulder
left_hip
right_hip
```

## 计算方式 A：头部侧倾角

优先使用双耳：

```text
head_tilt = atan2(
    right_ear.y - left_ear.y,
    right_ear.x - left_ear.x
) * 180 / π
```

若耳朵置信度低，使用双眼：

```text
eye_tilt = atan2(
    right_eye.y - left_eye.y,
    right_eye.x - left_eye.x
) * 180 / π
```

## 计算方式 B：头部相对身体中线偏移

```text
shoulder_mid = midpoint(left_shoulder, right_shoulder)
hip_mid = midpoint(left_hip, right_hip)
body_midline = line(shoulder_mid, hip_mid)

head_offset = signed_distance(nose, body_midline)
head_offset_norm = head_offset / distance(left_shoulder, right_shoulder)
```

## 关系

```text
abs(head_tilt) 越大
=> 头部侧倾越明显

abs(head_offset_norm) 越大
=> 头部相对身体中线偏移越明显
```

## 建议阈值

```text
abs(head_tilt) < 3°：基本正常
3° <= abs(head_tilt) < 5°：轻度头部侧倾
abs(head_tilt) >= 5°：明显头部侧倾风险

abs(head_offset_norm) < 0.03：基本居中
0.03 <= abs(head_offset_norm) < 0.08：轻度头部偏移
abs(head_offset_norm) >= 0.08：明显头部偏移风险
```

阈值为工程初始值，需要样本校准。

## 可靠性等级

高。

---

# 6.8 重心偏移 Center-of-Body / Support Center Offset

## 专业依据

严格意义上的人体重心需要三维身体分段、身体质量分布和足底压力信息。单张 2D 照片无法直接得到真实力学重心。因此，本系统应将其定义为：

```text
身体中轴相对足部支撑中心的偏移
```

即 “center-of-body offset” 或 “postural center offset”，而不是医学/力学意义上的真实 center of mass。

参考资料：

- Photogrammetry posture evaluation overview: https://pmc.ncbi.nlm.nih.gov/articles/PMC4757659/
- MediaPipe Pose Landmarker world coordinates: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker

## MediaPipe 可用关键点

```text
left_shoulder
right_shoulder
left_hip
right_hip
left_ankle
right_ankle
left_heel
right_heel
left_foot_index
right_foot_index
```

## 正面左右重心偏移

```text
shoulder_mid = midpoint(left_shoulder, right_shoulder)
hip_mid = midpoint(left_hip, right_hip)
body_center = midpoint(shoulder_mid, hip_mid)

ankle_mid = midpoint(left_ankle, right_ankle)

lateral_offset = body_center.x - ankle_mid.x
lateral_offset_norm = lateral_offset / distance(left_shoulder, right_shoulder)
```

## 侧面前后重心偏移

侧面照中，使用可见侧脚跟和脚尖估计足底支撑中心：

```text
foot_support_center = midpoint(visible_heel, visible_foot_index)
body_center = midpoint(visible_shoulder, visible_hip)

front_back_offset = body_center.x - foot_support_center.x
front_back_offset_norm = front_back_offset / distance(visible_heel, visible_foot_index)
```

同时计算身体倾斜角：

```text
body_lean = angle_between(
    vertical_line,
    vector(foot_support_center -> visible_shoulder)
)
```

## 关系

```text
body_center 相对 ankle_mid / foot_support_center 偏移越大
=> 身体中轴偏移越明显

侧面照中，肩髋整体位于足部支撑中心前方
=> 重心前移倾向

侧面照中，肩髋整体位于足部支撑中心后方
=> 重心后移倾向
```

## 推荐输出

```text
身体中轴偏移
重心偏移倾向
```

避免输出：

```text
真实人体重心异常
```

## 可靠性等级

中等。

---

# 6.9 驼背倾向 Thoracic Kyphosis / Kyphotic Posture

## 专业依据

真正的驼背/胸椎后凸评估通常需要胸椎相关解剖点，或 X 光 Cobb 角、脊柱测量仪、倾角仪等。摄影测量综述显示，上半身姿势角度可用于评估头颈肩胸椎姿势，但 MediaPipe 33 点没有胸椎点，因此不能直接计算胸椎后凸角。

参考资料：

- Photogrammetric Assessment of Upper Body Posture Using Postural Angles: https://pmc.ncbi.nlm.nih.gov/articles/PMC5446097/
- Photogrammetry as a tool for spinal posture evaluation: https://pmc.ncbi.nlm.nih.gov/articles/PMC4757659/

## MediaPipe 可用关键点

```text
visible_ear
visible_shoulder
visible_hip
```

## 自动模式：代理评分

```text
FHP_proxy = head_forward_offset_norm
round_shoulder_proxy = shoulder_forward_offset_norm
trunk_lean = angle_between(vertical_line, vector(visible_hip -> visible_shoulder))
```

综合评分：

```text
kyphosis_risk_score =
    0.4 * normalized(FHP_proxy)
  + 0.3 * normalized(round_shoulder_proxy)
  + 0.3 * normalized(trunk_lean)
```

## 关系

```text
头前伸越明显
+ 肩前引越明显
+ 躯干前倾越明显
=> 驼背倾向风险越高
```

## 推荐输出

```text
驼背倾向
上背圆弧增加风险
头颈肩前移综合倾向
```

不要输出：

```text
胸椎后凸角异常
```

## 专业补点模式

用户手动点选：

```text
C7
胸椎后凸顶点
T12 / 胸腰交界点
```

计算：

```text
thoracic_kyphosis_proxy_angle = angle(C7, thoracic_apex, T12)
```

或：

```text
upper_thoracic_line = C7 -> thoracic_apex
lower_thoracic_line = T12 -> thoracic_apex
kyphosis_angle = angle_between(upper_thoracic_line, lower_thoracic_line)
```

## 可靠性等级

自动模式：低到中。  
补点模式：中。

---

# 6.10 膝超伸 Knee Hyperextension / Genu Recurvatum

## 专业依据

膝超伸 / genu recurvatum 指膝关节伸展超过中立位。临床和摄影测量中常通过侧面观察髋-膝-踝对线或膝关节矢状面角度判断。文献指出，矢状面膝角通常使用股骨大转子、膝关节线、踝关节等解剖参考点，但 2D 测量会受到大腿和小腿旋转影响。

参考资料：

- Effects of Thigh and Leg Rotation on Sagittal Knee Angle Measurements: https://pmc.ncbi.nlm.nih.gov/articles/PMC12471106/
- Genu recurvatum definition: https://radiopaedia.org/articles/genu-recurvatum

## MediaPipe 可用关键点

```text
visible_hip
visible_knee
visible_ankle
visible_heel
visible_foot_index
```

## 计算方式 A：侧面膝关节角

```text
knee_angle = angle(visible_hip, visible_knee, visible_ankle)
```

普通夹角函数通常返回 0°–180°，可能无法直接表示超过 180° 的超伸方向，因此需要结合方向判断。

## 计算方式 B：膝点相对髋踝线的后移距离

```text
hip_ankle_line = line(visible_hip, visible_ankle)
knee_offset = signed_distance(visible_knee, hip_ankle_line)
knee_offset_norm = knee_offset / distance(visible_hip, visible_ankle)
```

使用脚部方向确定人体朝向：

```text
foot_direction = vector(visible_heel -> visible_foot_index)
```

若 knee 向身体后侧偏移：

```text
=> 膝超伸倾向
```

## 关系

```text
膝点越位于髋-踝连线后方
=> 膝超伸倾向越明显
```

## 推荐输出

```text
膝超伸倾向
膝关节过度伸展风险
```

## 可靠性等级

中高。

原因：MediaPipe 有髋、膝、踝、脚跟、脚尖点，比 MoveNet 更适合判断侧面下肢对线。但仍受拍摄角度和腿部旋转影响。

---

## 7. 10 类体态问题总览表

| 体态问题 | 照片方向 | MediaPipe 点 | 核心指标 | 是否可自动计算 | 可靠性 |
|---|---|---|---|---|---|
| 头前伸 | 侧面 | ear, shoulder, hip | ear-shoulder forward angle / offset | 可以近似 | 中 |
| 圆肩 | 侧面 | shoulder, hip, ear | shoulder forward offset + trunk lean | 可以近似 | 中低 |
| 骨盆前倾 | 侧面 | hip；补点 ASIS/PSIS | ASIS-PSIS pelvic tilt angle | 自动不建议，补点可做 | 自动低，补点中高 |
| 高低肩 | 正面 | left/right shoulder | shoulder slope | 可以 | 高 |
| 骨盆侧倾 | 正面 | left/right hip | pelvic slope | 可以近似 | 中 |
| 膝内扣 | 正面动作 | hip, knee, ankle | FPPA + knee offset | 可以 | 高 |
| 头部偏移 | 正面 | ears, eyes, nose, shoulders, hips | head tilt + head offset | 可以 | 高 |
| 重心偏移 | 正面/侧面 | shoulders, hips, ankles, heels, foot_index | body center vs support center | 可以近似 | 中 |
| 驼背倾向 | 侧面 | ear, shoulder, hip；补点胸椎 | FHP + shoulder + trunk lean | 可做代理，补点更好 | 自动低中，补点中 |
| 膝超伸 | 侧面 | hip, knee, ankle, heel, foot_index | knee posterior offset | 可以 | 中高 |

---

## 8. 推荐实现架构

```text
用户上传照片/视频帧
        ↓
照片类型识别：正面 / 侧面 / 动作帧
        ↓
MediaPipe Pose Landmarker 获取 33 点
        ↓
关键点置信度过滤
        ↓
按问题选择对应计算模块
        ↓
角度/距离归一化
        ↓
风险评分
        ↓
输出体态问题 + 解释 + 纠正建议
```

---

## 9. 关键点置信度过滤

建议每个计算模块都检查关键点置信度：

```text
if landmark.visibility < 0.5:
    该点不可用
```

建议规则：

```text
核心关键点全部 visibility >= 0.6：可计算
核心关键点部分 visibility 0.4~0.6：低置信度计算
核心关键点 visibility < 0.4：不输出该项结果
```

输出时增加：

```text
本项识别置信度：高 / 中 / 低
```

---

## 10. 推荐风险评分方式

不要使用单一角度硬判断，而是使用：

```text
risk_score = 主指标异常程度 * 0.7 + 辅助指标异常程度 * 0.3
```

风险等级：

```text
0 - 30：未见明显异常
31 - 60：轻度倾向
61 - 80：中度风险
81 - 100：明显风险
```

示例：头前伸

```text
FHP_score =
    0.7 * normalized(head_forward_offset_norm)
  + 0.3 * normalized(FHP_angle_abnormality)
```

示例：驼背倾向

```text
kyphosis_score =
    0.4 * normalized(head_forward_offset_norm)
  + 0.3 * normalized(shoulder_forward_offset_norm)
  + 0.3 * normalized(trunk_lean)
```

---

## 11. 推荐产品输出话术

### 正确表达

```text
根据侧面照片中耳、肩、髋的相对位置，系统检测到头部相对肩部存在前移，提示头前伸倾向。
```

```text
根据正面照片中左右肩点高度差，系统检测到肩部水平线存在倾斜，提示高低肩倾向。
```

```text
根据正面深蹲动作中髋-膝-踝连线，系统检测到膝点向身体中线偏移，提示动态膝内扣风险。
```

### 避免表达

```text
你患有头前伸。
```

```text
你存在胸椎后凸畸形。
```

```text
你的骨盆前倾角异常。
```

除非有手动补点或专业测量依据，否则不建议使用医学诊断式表达。

---

## 12. 替换 MoveNet 的开发注意事项

### 12.1 坐标差异

MediaPipe 输出可能包括：

```text
landmarks: image normalized coordinates
world_landmarks: metric-like 3D coordinates
```

建议：

- 2D 角度和屏幕展示：使用 normalized image landmarks。
- 前后深度、身体朝向辅助判断：使用 world_landmarks。
- 单张照片体态筛查：优先使用 2D landmarks，减少 3D 估计误差影响。

### 12.2 镜像问题

前置摄像头或上传图片可能出现左右镜像。

建议：

```text
在结果中只说“画面左侧/画面右侧”
或在用户确认镜像后再说“左肩/右肩”
```

### 12.3 拍摄角度校验

如果正面照身体旋转明显，高低肩、骨盆侧倾、膝内扣都会受影响。

可用以下指标初步判断：

```text
shoulder_width 与 hip_width 是否异常
左右耳/肩/髋 visibility 是否严重不对称
侧面照中左右肩/髋是否明显分离
```

### 12.4 多帧稳定

若使用视频，建议：

```text
每个动作取 5~10 帧
去掉异常点
使用中位数或均值平滑
```

---

## 13. 优先级建议

### 第一阶段：MediaPipe 自动筛查版

优先实现：

1. 高低肩
2. 骨盆侧倾
3. 头部偏移
4. 膝内扣
5. 膝超伸
6. 重心偏移

### 第二阶段：侧面姿态综合评分

实现：

1. 头前伸倾向
2. 圆肩倾向
3. 驼背倾向

这些用多指标综合，不做强诊断。

### 第三阶段：专业补点模式

实现：

1. 骨盆前倾：ASIS + PSIS
2. 头前伸标准 CVA：C7 + ear
3. 驼背角度：C7 + thoracic apex + T12
4. 圆肩专业角：C7 + acromion

---

## 14. 附录：伪代码示例

### 14.1 三点角度

```python
import math
import numpy as np

def angle_3pts(a, b, c):
    v1 = np.array([a.x - b.x, a.y - b.y])
    v2 = np.array([c.x - b.x, c.y - b.y])
    cos_theta = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
    cos_theta = np.clip(cos_theta, -1.0, 1.0)
    return math.degrees(math.acos(cos_theta))
```

### 14.2 两点线段相对水平线角度

```python
def angle_to_horizontal(p1, p2):
    return math.degrees(math.atan2(p2.y - p1.y, p2.x - p1.x))
```

### 14.3 中点

```python
def midpoint(p1, p2):
    return Point(
        x=(p1.x + p2.x) / 2,
        y=(p1.y + p2.y) / 2
    )
```

### 14.4 高低肩

```python
def shoulder_slope(left_shoulder, right_shoulder):
    angle = angle_to_horizontal(left_shoulder, right_shoulder)
    return angle

def shoulder_asymmetry_result(left_shoulder, right_shoulder):
    slope = shoulder_slope(left_shoulder, right_shoulder)

    if abs(slope) < 2:
        level = "基本对称"
    elif abs(slope) < 5:
        level = "轻度高低肩倾向"
    else:
        level = "明显高低肩风险"

    higher_side = "left" if left_shoulder.y < right_shoulder.y else "right"

    return {
        "slope": slope,
        "level": level,
        "higher_side": higher_side
    }
```

### 14.5 膝内扣偏移

```python
def signed_distance_point_to_line(p, a, b):
    # line from a to b
    ax, ay = a.x, a.y
    bx, by = b.x, b.y
    px, py = p.x, p.y

    return ((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / math.sqrt((bx - ax)**2 + (by - ay)**2)

def knee_valgus_offset(hip, knee, ankle):
    offset = signed_distance_point_to_line(knee, hip, ankle)
    norm = offset / distance(hip, ankle)
    return norm
```

---

## 15. 最终结论

使用 MediaPipe BlazePose 33 点替代 MoveNet 17 点是合理的，尤其适合以下体态问题：

```text
高低肩
骨盆侧倾
头部偏移
膝内扣
膝超伸
重心偏移
```

对于以下问题，MediaPipe 可做自动筛查，但不建议作为严格专业测量：

```text
头前伸
圆肩
驼背倾向
```

对于骨盆前倾，MediaPipe 33 点仍然不足，推荐采用：

```text
MediaPipe 自动识别 + 用户手动补点 ASIS/PSIS
```

最终产品定位应为：

> 基于 MediaPipe 33 点的人体姿态关键点识别与体态风险筛查系统，通过关键点角度、距离偏移和多指标融合，提示用户可能存在的体态问题，并为后续纠正训练提供依据。

