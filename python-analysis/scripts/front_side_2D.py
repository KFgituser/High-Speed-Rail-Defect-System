import os, sys, re
# 用 Agg，避免后端卡在弹窗
os.environ.setdefault("MPLBACKEND", "Agg")

import json

import matplotlib.pyplot as plt #引入模块


from model_generate import *
from result_vote import *
from data_save import *
from data_collect import *

print("[PY] exe      =", sys.executable)
print("[PY] cwd      =", os.getcwd())
print("[PY] VIZ_OUT  =", os.environ.get("VIZ_OUT_DIR"))


# 统一文件路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_OUT = os.environ.get("VIZ_OUT_DIR", os.path.join(BASE_DIR, "output"))
SINGLE_INPUT = os.environ.get("VIZ_INPUT_FILE")
DATA_ROOT = os.environ.get("VIZ_NPY_DIR", "D:/JingHu_Data/")
VIZ_LANG = (os.environ.get("VIZ_LANG", "zh") or "zh").lower()
IS_EN = VIZ_LANG.startswith("en")
os.makedirs(BASE_OUT, exist_ok=True)

TEXT = {
    "validation_section": "Validation section" if IS_EN else "验证区段",
    "training_section": "Training section" if IS_EN else "训练区段",
    "mileage": "Mileage" if IS_EN else "里程",
    "amplitude": "Amplitude" if IS_EN else "振幅",
    "damage": "Damage" if IS_EN else "破损",
    "crack": "Crack" if IS_EN else "裂纹",
    "mud_jacking": "Mud jacking" if IS_EN else "冒浆",
    "diagonal_crack": "Diagonal crack" if IS_EN else "斜裂纹",
}

def _resolve_path(root_path, name):
    # 既支持绝对路径，也支持仅文件名
    return name if os.path.isabs(name) else os.path.join(root_path, name)

print("[PY] exe =", sys.executable)
print("[PY] cwd =", os.getcwd())
print("[PY] OUT =", BASE_OUT)
print("[PY] BASE_DIR =", BASE_DIR)

# 模型/数据用绝对路径
MODEL_PATH = os.path.join(BASE_DIR, "check_point", "transformer", "check_points.pth")
# …后面用 MODEL_PATH

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
def _segment_mean_1d(arr, seglen):
    """按 seglen 做等长分段均值，不够整段的尾巴丢弃。"""
    usable = (len(arr) // seglen) * seglen
    a = arr[:usable].reshape(-1, seglen)
    return a.mean(axis=1)

def _km_from_str(s):
    s = str(s).upper().strip()
    if s.startswith('K'):
        s = s[1:]
    a, b = s.split('+')
    return float(a) + float(b)/1000.0

def _km_to_str(km):
    k = int(km // 1)
    m = int(round((km - k)*1000))
    if m >= 1000:  # 处理四舍五入溢出
        k += 1; m = 0
    return f'K{k}+{m:03d}'

def _build_labels(n, start='K1152+864', end='K1138+464'):
    k0 = _km_from_str(start); k1 = _km_from_str(end)
    vals = np.linspace(k0, k1, n)
    return np.array([_km_to_str(v) for v in vals], dtype=object)

def amp_mask_gen(train_index, len_mask, ori_len, gap=5):
    train_index = [int(len_mask * i / ori_len) for i in train_index]
    left_dex = min(train_index)
    right_dex = max(train_index)
    mask = []
    for i in range(len_mask):
        if (i in train_index) or ((left_dex - i < gap - 1) and (i < left_dex)) or ((i - right_dex < gap + 2) and (i > right_dex)):
            mask.append(0)
        else:
            mask.append(100)
    return mask

def amp_train_track(raw_data, jug_ratio=0.2):
    out_put_index = []
    train_index = np.where(raw_data > 20)
    train_index = train_index[0]
    for i in range(len(train_index)):
        if (raw_data[train_index[i] - 2] > raw_data[train_index[i]] * jug_ratio) and (raw_data[train_index[i] + 2] > raw_data[train_index[i]] * jug_ratio) and \
        (raw_data[train_index[i] - 4] > raw_data[train_index[i]] * jug_ratio) and (raw_data[train_index[i] - 4] > raw_data[train_index[i]] * jug_ratio) and\
        (raw_data[train_index[i] - 6] > raw_data[train_index[i]] * jug_ratio) and (raw_data[train_index[i] - 6] > raw_data[train_index[i]] * jug_ratio):
            out_put_index.append(train_index[i])
    return out_put_index


def demo_show(
    row_per_detect=512, num_event=4,
    len_subsegment=13, jug_dis=0.1,
    root_path=DATA_ROOT,
    model_path=MODEL_PATH,
    train_track='amp', mode='detect', visual='all',
    save_path='./dataset/re_collect/',
    amp_visual='n',
    out_dir=BASE_OUT
):
    defects_dict = {}  # key: 分段索引 m -> {"cls": 1/2/3, 年月日时分秒}
    cls_map = {1: "裂纹", 2: "破损", 3: "冒浆", 4: "斜裂纹"}
    amps_list_for_surface = []  # 收集3D所需每帧的(按分段后的)振幅
    x_labels_saved = None  # >>> NEW：首帧确定x_labels并保存一份
    USE_GPU = True
    error_batch = 0
    if USE_GPU and torch.cuda.is_available():
        device = torch.device('cuda')
    else:
        device = torch.device('cpu')
    dtype = torch.float32
    true_dic, query_dic = scratch_label_gen()

    model = ModelGenerator(
        row_per_detect=row_per_detect, num_event=num_event, num_tokens=len_subsegment
    ).DetectModel_large(
        dropout=0.2, pre_train=True, state_dir=model_path
    ).to(device=device).eval()

    # 如果传入了单文件，就只跑这个；否则跑整个目录
    if SINGLE_INPUT:
        # 既支持传绝对路径，也支持文件名
        if os.path.isabs(SINGLE_INPUT):
            files = [SINGLE_INPUT]
        else:
            files = [os.path.join(root_path, SINGLE_INPUT)]
    else:
        files = sorted([os.path.join(root_path, f) for f in os.listdir(root_path) if f.lower().endswith('.npy')])

    if not files:
        raise RuntimeError(f"No .npy files found (root={root_path}, single={SINGLE_INPUT})")

    init_data = abs(np.load(files[0], allow_pickle=True))

    x_labels = np.arange(0, init_data.shape[1], len_subsegment) + (len_subsegment // 2)     # For segment x label
    true_mask_pos = disease_list_gen(true_dic, init_data.shape[1], len(x_labels))

    result_pool_ = Result_pool(point_pos=x_labels, num_event=num_event)
    save_index = 0


    for fidx, file in enumerate(files, start=1):
        data_now = abs(np.load(file, allow_pickle=True))
        fname = os.path.basename(file)
        # 新增：告诉前端“当前正在处理的文件”
        print(f"FILE {fidx}/{len(files)} {fname}")
        sys.stdout.flush()
        # 匹配 HSR_2025_09_03__14_00_47.npy
        m = re.search(r'(\d{4})_(\d{2})_(\d{2})__([0-9]{2})_([0-9]{2})_([0-9]{2})', fname)
        if m:
            year, month, day, hour, minute, second = m.groups()
        else:
            year, month, day, hour, minute, second = "2025", "09", "03", "00", "00", "00"



        time_root_title = list(file[4 : -7])
        time_root_title = ''.join(time_root_title)
        raw_data = np.zeros((row_per_detect, data_now.shape[1]))
        j = 0
        for i in range(len(data_now)):
            raw_data[j, :] = data_now[i, :]
            j += 1
            if (j + 1) == row_per_detect:
                j = 0
                try:
                    # —— 预处理、送入模型推理 ——
                    raw_data_ = split_to_subseg(raw_data, len_subsegment)
                    raw_data_ = tensor_normal(raw_data_)

                    # （可选）为 3D 曲面准备每帧的分段均值振幅
                    frame_amp = raw_data.mean(axis=0)
                    frame_amp_seg = _segment_mean_1d(frame_amp, len_subsegment)
                    if x_labels_saved is None:
                        # 与分段数一致的标签：从 K1152+864 均匀插值到 K1138+464
                        x_labels_saved = _build_labels(len(frame_amp_seg), 'K1152+864', 'K1138+464')
                    amps_list_for_surface.append(frame_amp_seg.astype(float))

                    # —— 推理 ——
                    raw_data_ = raw_data_.to(device=device, dtype=dtype)
                    model.to(device=device).eval()
                    scores = model(raw_data_)
                    _, preds = scores.max(1)
                    preds = preds.numpy()

                    # —— 先算 mask（按 train_track 分支）——
                    if train_track == 'cluster':
                        mask = mask_cluster(
                            raw_data_,
                            n_cluster=3, mode='euclidean', verbose=0, device=device, jug_dis=jug_dis
                        )
                    elif train_track == 'amp':
                        train_index = amp_train_track(raw_data.mean(axis=0), jug_ratio=0.2)
                        if train_index == []:
                            mask = [100] * (raw_data.shape[1] // len_subsegment)
                        else:
                            mask = amp_mask_gen(train_index, raw_data.shape[1] // len_subsegment, data_now.shape[1], 4)
                    else:
                        mask = [0] * (raw_data.shape[1] // len_subsegment)  # 兜底

                    # —— 组合检测结果（模型 + mask）——
                    detect_result = [preds[i] + mask[i] for i in range(len(mask))]
                    num_subseg = len(detect_result)

                    # （可选）采集模式
                    if mode == 'collect':
                        collect_mask = [i for i in range(len(mask)) if mask[i] == 0]
                        label = []
                        for pos in collect_mask:
                            if str(pos) in true_mask_pos.keys():
                                label.append(true_mask_pos[str(pos)])
                            else:
                                label.append(0)
                        save_index = data_save(
                            raw_data_[collect_mask], label,
                            save_path=save_path, save_index=save_index
                        )

                    # —— 累计投票 & 得到当前统计 ——
                    result_pool_.update(detect_result)
                    result_count_now = result_pool_.output()

                    second_now = 6 * (i / data_now.shape[0])  # 当前秒数（用于界面显示）
                    # —— 累积"首次出现"的缺陷点（用于导出 defects.json）——
                    for m, val in enumerate(detect_result):
                        if val in (1, 2, 3, 4) and m not in defects_dict:
                            defects_dict[m] = {
                                "cls": int(val),
                                "year": year,
                                "month": month,
                                "day": day,
                                "hour": hour,
                                "minute": minute,
                                "second": second,
                                "time_s": float(second_now) # 靠它做 3D 的 X 轴
                            }

                    # —— 准备绘图 ——
                    plt.clf()
                    plt.rcParams['font.sans-serif'] = ['SimHei']

                    second_now = 6 * (i / data_now.shape[0])  # ✅ 先计算
                    second_now_str = f"{second_now:.3f}"
                    plt.title(f"{year}/{month}/{day}, {hour}:{minute}:{second} + {second_now_str} s")  # ✅ 再写标题

                    if visual == 'all':
                        # Additional Visual

                        ###### Note part
                        note_y = np.arange(0, 40, 0.01)
                        note_x = [1000] * len(note_y)
                        plt.plot(note_x, note_y, color='grey', linestyle='--')
                        plt.text(500, 35, TEXT["validation_section"], fontsize=11, ha='center')
                        plt.text(1800, 35, TEXT["training_section"], fontsize=11, ha='center')

                    if amp_visual == 'y':
                        plt.plot(raw_data.mean(axis=0), linewidth = 0.5, color='grey', zorder=1)


                    plt.xlabel(TEXT["mileage"])
                    plt.ylabel(TEXT["amplitude"])
                    plt.xlim([0, 2600])
                    plt.ylim([0, 40])
                    plt.xticks([0, 500, 1000, 1500, 2000, 2500], ['K1152+864','K1149+984','K1147+104','K1144+224','K1141+344', 'K1138+464'], rotation=30)
                    plt.yticks([])


                    for m in range(num_subseg):                 # Result for now and Train, ## Verified color b,g
                        if detect_result[m] < 100:
                            plt.scatter(x_labels[m], 0, marker='x', color='r', s=25, zorder=2)
                        if detect_result[m] == 1 :
                            plt.scatter(x_labels[m], 10, marker='o', color='r', s=25, zorder=2)
                        if detect_result[m] == 2 :
                            plt.scatter(x_labels[m], 10, marker='o', color='g', s=25, zorder=2)
                        if detect_result[m] == 3 :
                            plt.scatter(x_labels[m], 10, marker='o', color='b', s=25, zorder=2)
                        if detect_result[m] == 4:
                            plt.scatter(x_labels[m], 10, marker='o', color='orange', s=25, zorder=2)

                    ############################# Result visual
                    if visual != 'all':
                        visual_cunt = [0,0,0,0]
                        for k, v in result_count_now.items():
                            if v == 1:
                                if visual_cunt[1 - 1] == 0:
                                    plt.scatter(int(k), 30, marker='o', color='r', s=25, zorder=3, label=TEXT["crack"])# query_dic['1'])
                                    visual_cunt[1 - 1] += 1
                                else:
                                    plt.scatter(int(k), 30, marker='o', color='r', s=25, zorder=3)
                            if v == 2:
                                if visual_cunt[2 - 1] == 0:
                                    plt.scatter(int(k), 30, marker='o', color='g', s=25, zorder=3, label=TEXT["damage"])# query_dic['2'])
                                    visual_cunt[2 - 1] += 1
                                else:
                                    plt.scatter(int(k), 30, marker='o', color='g', s=25, zorder=3)
                            if v == 3:
                                if visual_cunt[3 - 1] == 0:
                                    plt.scatter(int(k), 30, marker='o', color='b', s=25, zorder=3, label=TEXT["mud_jacking"])# query_dic['3'])
                                    visual_cunt[3 - 1] += 1
                                else:
                                    plt.scatter(int(k), 30, marker='o', color='b', s=25, zorder=3)
                            if v == 4:
                                if visual_cunt[4 - 1] == 0:
                                    plt.scatter(int(k), 30, marker='o', color='orange', s=25, zorder=3, label=TEXT["diagonal_crack"])
                                    visual_cunt[4 - 1] += 1
                                else:
                                    plt.scatter(int(k), 30, marker='o', color='orange', s=25, zorder=3)

                    else:
                        for k, v in result_count_now.items():                # Result for history  ## Verified color b,g
                            if v == 1 :
                                plt.scatter(int(k), 20, marker='o', color='r', s=25, zorder=3)
                            if v == 2 :
                                plt.scatter(int(k), 20, marker='o', color='g', s=25, zorder=3)
                            if v == 3 :
                                plt.scatter(int(k), 20, marker='o', color='b', s=25, zorder=3)
                            if v == 4:
                                plt.scatter(int(k), 20, marker='o', color='orange', s=25, zorder=3)

                    from matplotlib.lines import Line2D
                    handles = [
                        Line2D([], [], color='g', marker='o', linestyle='', label=TEXT["damage"]),
                        Line2D([], [], color='r', marker='o', linestyle='', label=TEXT["crack"]),
                        Line2D([], [], color='orange', marker='o', linestyle='', label=TEXT["diagonal_crack"]),
                        Line2D([], [], color='b', marker='o', linestyle='', label=TEXT["mud_jacking"]),
                    ]
                    plt.legend(handles=handles, loc='upper right')

                    second_now = 6 * (i / data_now.shape[0])  # 保持这里的计算
                    second_now_str = '%.03f' % second_now
                    plt.title(
                        year + '/' + month + '/' + day + ', ' + hour + ':' + minute + ':' + second + ' + ' + second_now_str + ' s')

                    plt.tight_layout()
                    plt.savefig(os.path.join(out_dir, "viz2d_preview.png"), dpi=120)
                    print(f"PROGRESS {i}/{data_now.shape[0]}")  # 或者用你自己的步数
                    sys.stdout.flush()
                except:
                    error_batch += 1
    # 1152+864 -> 1129+089 = 23775 m 全长,
    # 共4095个数据点，截取2600，0.635，实际长15100 m, 点间距5.76m

    # 200段，每段75m, 单个样本13个测量点，单个样本75m
    # 一列火车 200 400 m，对应2.66个段，或5段
    try:
        print('Error batch num : ', error_batch)
    except:
        pass

    def _km_range_from_labels(labels, idx):
        """给定分段中心标签数组 labels 和索引 idx，推算该分段的左右边界（公里数）。"""
        vals = np.array([_km_from_str(s) for s in labels], dtype=float)
        # 用相邻中心点的中点做边界；两端用外推
        left = vals[idx - 1] + (vals[idx] - vals[idx - 1]) * 0.5 if idx > 0 else vals[idx] - (vals[1] - vals[0]) * 0.5
        right = vals[idx] + (vals[idx + 1] - vals[idx]) * 0.5 if idx < len(vals) - 1 else vals[idx] + (
                    vals[-1] - vals[-2]) * 0.5
        return left, right

    if amps_list_for_surface and x_labels_saved is not None:
        # 1) 先保存 3D 所需的 .npy
        np.save(os.path.join(out_dir, 'amps_stack.npy'), np.array(amps_list_for_surface, dtype=float))
        np.save(os.path.join(out_dir, 'x_labels.npy'), x_labels_saved)
        np.save(os.path.join(out_dir, 'total_time_seconds.npy'), np.array(6.0, dtype=float))

        # 2) 再把累积到的缺陷导出为 defects.json
        # 把 2D 的里程“刻度”（和你图上一样的 6 个刻度）也保存一下，3D 直接复用
        y_ticks_like_2d = np.array(['K1152+864', 'K1149+984', 'K1147+104', 'K1144+224', 'K1141+344', 'K1138+464'],
                                   dtype=object)
        np.save(os.path.join(out_dir, 'y_ticks_like_2d.npy'), y_ticks_like_2d)
        #   导出缺陷，
        defects = []
        for m, info in defects_dict.items():
            defects.append({
                "datetime": f"{info['year']}-{info['month']}-{info['day']} {info['hour']}:{info['minute']}:{info['second']}",
                "mileage": str(x_labels_saved[int(m)]),
                "cls": cls_map[info["cls"]],
                "time_s": float(info["time_s"]),  # 3D X 轴
            })
        with open(os.path.join(out_dir, "defects.json"), "w", encoding="utf-8") as f:
            json.dump(defects, f, ensure_ascii=False, indent=2)
        print(f"已保存 defects.json，共 {len(defects)} 个缺陷点")
    plt.ioff()

    def _km_label_from_text(s):
        """如果x_labels_saved本身就是 'K1138+464' 这种文本，就直接返回。"""
        return str(s)

    def _km_label_from_meters(m):
        """如果你拿到的是数值(单位:米)，转成 Kxxx+yyy 字符串。"""
        m = int(round(float(m)))
        km, mm = divmod(m, 1000)
        return f"K{km}+{mm:03d}"

    # 方式1：如果你保存了 x_labels_saved（推荐）
    try:
        left_label = _km_label_from_text(x_labels_saved[0])
        right_label = _km_label_from_text(x_labels_saved[-1])
    except Exception:
        # 方式2：若没有 x_labels_saved，就用当前坐标轴的刻度文本兜底
        ax = plt.gca()
        tick_texts = [t.get_text() for t in ax.get_xticklabels()]
        tick_texts = [t for t in tick_texts if t] or ["", ""]
        left_label = tick_texts[0]
        right_label = tick_texts[-1]

    # —— 保存最终图 ——
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "viz2d.png"), dpi=150)
    plt.close()

    # —— 在出图时同时写 meta.json（记录左右端坐标）。 前端在 DONE 之后读这份 JSON 来更新“位置区间”。 ——
    meta = {
        "start_label": left_label,
        "end_label": right_label
        # 也可以加数值（米），方便其他地方使用：
        # "start_m": start_abs_m, "end_m": end_abs_m
    }
    with open(os.path.join(out_dir, "viz2d_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"META start={left_label} end={right_label}")
    sys.stdout.flush()


def main():
    demo_show(
        row_per_detect=512, num_event=4, len_subsegment=13,
        train_track='amp', jug_dis=0.1,
        mode='default', save_path='',
        visual='all',
        amp_visual='y',
        root_path=DATA_ROOT,
        model_path=os.path.join(BASE_DIR, 'check_point', 'transformer', 'check_points.pth'),
        out_dir=BASE_OUT   # 把输出目录传进去
    )

if __name__ == "__main__":
    try:
        main()
        print("DONE")
        sys.stdout.flush()
        sys.exit(0)
    except Exception as e:
        print("ERROR", repr(e))
        import traceback
        traceback.print_exc()
        sys.stdout.flush()
        sys.exit(1)
