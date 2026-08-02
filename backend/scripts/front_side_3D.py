# -*- coding: utf-8 -*-
"""
这部分代码是用来生成 3D 图像的 Python 脚本，任务完成后会将生成的图像路径和状态写入 run_result.json。

主要做的事情包括：
读取 .npy 文件
生成 3D 图像
将图像路径写入 run_result.json
"""

import os,sys
import json

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator, FuncFormatter
from matplotlib.lines import Line2D



# -----------------------------
# 里程格式解析/格式化
# -----------------------------
def parse_km(kstr: str) -> float:
    """将 'K1147+104' 解析为 1147.104（单位：km）"""
    if isinstance(kstr, (int, float, np.floating)):
        return float(kstr)

    s = str(kstr).strip().upper()
    if s.startswith('K'):
        s = s[1:]
    if '+' in s:
        a, b = s.split('+', 1)
        a = a.strip()
        b = b.strip()
        if a == '':
            a = '0'
        km = float(a)
        m = float(b)
        return km + m / 1000.0
    try:
        return float(s)
    except Exception:
        raise ValueError(f"无法解析里程字符串: {kstr}")


def format_km(val: float) -> str:
    """将 1147.104 -> 'K1147+104'"""
    k = int(np.floor(val))
    m = int(round((val - k) * 1000))
    # 防止四舍五入出现 1000
    if m >= 1000:
        k += 1
        m = 0
    return f"K{k}+{m:03d}"



# -----------------------------
# 数据加载（优先真实文件）
# -----------------------------
def load_or_demo():
    """优先从本地文件加载，如果文件不存在则输出提示信息"""
    base_dir = os.environ.get("VIZ_OUT_DIR", "./resources")  # 获取环境变量中的 VIZ_OUT_DIR 或使用默认路径

    amps_path = os.path.join(base_dir, "amps_stack.npy")
    xlab_path = os.path.join(base_dir, "x_labels.npy")
    tlen_path = os.path.join(base_dir, "total_time_seconds.npy")

    # 检查文件是否存在
    if os.path.exists(amps_path) and os.path.exists(xlab_path):
        a = np.load(amps_path, allow_pickle=True)
        x_labels = np.load(xlab_path, allow_pickle=True)
        total_time_seconds = float(np.load(tlen_path)) if os.path.exists(tlen_path) else 6.0

        if isinstance(a, np.ndarray):
            if a.ndim == 2:
                Nt, Ny = a.shape
                amps_list = [a[i, :] for i in range(Nt)]
            elif a.ndim == 1:
                amps_list = [np.asarray(row) for row in a]
            else:
                raise ValueError("amps_stack.npy 维度不符合 (Nt, Ny) 或 [Nt][Ny]")
        else:
            amps_list = [np.asarray(row) for row in a]

        return amps_list, x_labels, total_time_seconds

    else:
        # 如果文件不存在，输出相关提示信息
        missing_files = []
        if not os.path.exists(amps_path):
            missing_files.append("amps_stack.npy")
        if not os.path.exists(xlab_path):
            missing_files.append("x_labels.npy")
        if not os.path.exists(tlen_path):
            missing_files.append("total_time_seconds.npy")

        raise FileNotFoundError(f"以下文件缺失: {', '.join(missing_files)}")

# -----------------------------
#把 2D 动态图程序生成的 defects.json 读进来，变成 Python 的 list/dict 数据结构，然后交给 3D 绘图函数去 ax.scatter(...) 画缺陷点。
# -----------------------------
def load_defects_json(base_dir: str):
    candidates = [
        os.path.join(base_dir, "defects.json"),
        "defects.json",
    ]
    for p in candidates:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
            # 兜底：确保是 list
            return data if isinstance(data, list) else []
    return []


# -----------------------------
# 读取你 2D 程序保存的 y_ticks_like_2d.npy，把里面的里程刻度（例如 K1147+104 这种）加载出来，然后用于 3D 图的 Y 轴刻度显示。
# -----------------------------
def load_y_ticks_like_2d(base_dir: str):
    p = os.path.join(base_dir, "y_ticks_like_2d.npy")
    if os.path.exists(p):
        arr = np.load(p, allow_pickle=True)
        return [str(x) for x in arr.tolist()]
    return None

# -----------------------------
# 3D 绘制（Z=离散类别层）
# -----------------------------
DEFECT_COLORS = {'破损': 'g', '裂纹': 'r', '斜裂纹': 'orange', '冒浆': 'b'}
DEFECT_ORDER = [('破损', 1, 0.10), ('裂纹', 2, 0.12), ('斜裂纹', 3, 0.13), ('冒浆', 4, 0.14)]
CLS_TO_Z = {name: z for name, z, _alpha in DEFECT_ORDER}
DEFECT_LABELS = {
    'zh': {'破损': '破损', '裂纹': '裂纹', '斜裂纹': '斜裂纹', '冒浆': '冒浆'},
    'en': {'破损': 'Damage', '裂纹': 'Crack', '斜裂纹': 'Diagonal crack', '冒浆': 'Mud jacking'},
}


def current_lang():
    return 'en' if os.environ.get('VIZ_LANG', 'zh').lower().startswith('en') else 'zh'


def defect_label(name):
    return DEFECT_LABELS[current_lang()].get(name, name)


def plot_defects_categorical_z(
    amps_list,
    x_labels,
    total_time_seconds=6.0,
    defects=None,  # [{'time_s':..., 'mileage':..., 'cls':'裂纹'}, ...]
    fig_size=(15, 11.5),
    view_elev=26,
    view_azim=-58,
    grid_nt=60,
    grid_ny=80,
    y_ticks_k=None
):
    """X: Time(s)；Y: Mileage(K+xxx)；Z: 类别层(1/2/3)"""
    plt.rcParams['font.sans-serif'] = ['SimHei']
    plt.rcParams['axes.unicode_minus'] = False

    assert len(amps_list) > 0, "amps_list 为空"
    Ny = min(len(a) for a in amps_list)
    amps_list = [np.asarray(a)[:Ny] for a in amps_list]
    Nt = len(amps_list)

    x_labels = np.asarray(x_labels)[:Ny]
    mileage = np.array([parse_km(x) for x in x_labels], dtype=float)
    if mileage[0] > mileage[-1]:
        mileage = mileage[::-1]
    time = np.linspace(0.0, float(total_time_seconds), Nt)

    fig = plt.figure(figsize=fig_size, dpi=120)
    ax = fig.add_subplot(111, projection='3d')

    # Create grids for the surface plot
    t_grid = np.linspace(time.min(), time.max(), min(grid_nt, Nt))
    m_grid = np.linspace(mileage.min(), mileage.max(), min(grid_ny, Ny))
    T, M = np.meshgrid(t_grid, m_grid)

    # Plot the surface for each defect type
    for name, zlv, alpha in DEFECT_ORDER:
        Z = np.full_like(T, float(zlv))
        ax.plot_surface(T, M, Z, rstride=1, cstride=1,
                        linewidth=0, antialiased=True,
                        alpha=alpha, color=DEFECT_COLORS[name])

    # Plot the defects as scatter points
    if defects:
        for d in defects:
            cls = d.get('cls')
            if cls not in CLS_TO_Z:
                continue
            t = d.get('time_s', None)
            mlabel = d.get('mileage', None)
            if t is None or mlabel is None:
                continue

            x = float(t)  # Time = X axis
            y = parse_km(str(mlabel))  # Mileage = Y axis
            z = float(CLS_TO_Z[cls])  # Defect type = Z axis
            ax.scatter(x, y, z, s=65, c=DEFECT_COLORS[cls],
                       marker='o', depthshade=False, edgecolor='k', linewidths=0.3)

    # Set axis labels
    ax.set_xlabel('Time (s)', fontsize=16, labelpad=12)
    ax.set_ylabel('Mileage', fontsize=16, labelpad=18)
    ax.set_zlabel('Defect Type', fontsize=16, labelpad=28)
    ax.tick_params(axis='x', labelsize=12, pad=8)
    ax.tick_params(axis='y', labelsize=12, pad=8)
    ax.tick_params(axis='z', labelsize=12, pad=6) # type: ignore[arg-type]

    # Set the grid and y-ticks
    t_grid = np.linspace(time.min(), time.max(), min(grid_nt, Nt))

    ytick_vals_sorted = None
    if y_ticks_k:
        ytick_vals_sorted = np.sort([parse_km(s) for s in y_ticks_k])
        m_grid = np.linspace(ytick_vals_sorted[0], ytick_vals_sorted[-1], min(grid_ny, Ny))
    else:
        m_grid = np.linspace(mileage.min(), mileage.max(), min(grid_ny, Ny))

    T, M = np.meshgrid(t_grid, m_grid)

    for name, zlv, alpha in DEFECT_ORDER:
        Z = np.full_like(T, float(zlv))
        ax.plot_surface(T, M, Z, rstride=1, cstride=1,
                        linewidth=0, antialiased=True,
                        alpha=alpha, color=DEFECT_COLORS[name])

    # Set Y ticks and labels
    if y_ticks_k:
        ax.set_ylim(ytick_vals_sorted[0], ytick_vals_sorted[-1])
        ax.set_yticks(ytick_vals_sorted)
        ax.set_yticklabels(y_ticks_k)
        for lbl in ax.get_yticklabels():
            lbl.set_rotation(-20)
            lbl.set_ha('right')
            lbl.set_va('center')
    else:
        ax.yaxis.set_major_locator(MaxNLocator(nbins=6, min_n_ticks=4))
        ax.yaxis.set_major_formatter(FuncFormatter(lambda v, pos: format_km(v)))

    # Set Z axis limits and labels
    ax.set_zlim(0.5, 4.5)
    ax.set_zticks([z for _name, z, _alpha in DEFECT_ORDER])
    ax.set_zticklabels([defect_label(name) for name, _z, _alpha in DEFECT_ORDER])

    # Set the view angle
    ax.view_init(elev=view_elev, azim=view_azim)

    # Add legend 构造图例句柄
    handles = [
        Line2D([], [], color=DEFECT_COLORS[name], marker='o', linestyle='', label=defect_label(name))
        for name, _z, _alpha in DEFECT_ORDER
    ]
    # 添加图例
    ax.legend(handles=handles, loc='upper right', fontsize=13)

    # Adjust layout with more space
    plt.subplots_adjust(left=0.08, right=0.88, top=0.92, bottom=0.10)  # Manually adjust margins

    # Create output directory if it doesn't exist
    out_dir = os.environ.get("VIZ_OUT_DIR", "./output/3D image")
    os.makedirs(out_dir, exist_ok=True)

    # Save the image
    output_image_path = os.path.join(out_dir, "image3D.png")
    fig.savefig(output_image_path, dpi=150, bbox_inches="tight", pad_inches=0.25)

    # Write result to JSON
    result = {
        "status": "SUCCESS",
        "result3dUrl": f"file://{output_image_path}",
        "runUuid": os.environ.get("RUN_UUID")
    }

    with open(os.path.join(out_dir, "3Drun_result.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    print(f"图像生成完成，路径为: {output_image_path}")
    sys.stdout.flush()
    plt.close()


# -----------------------------
# main：示例 & 命令行参数
# -----------------------------
def main():
    base_dir = os.environ.get("VIZ_OUT_DIR", "./resources")
    amps_list, x_labels, total_time = load_or_demo()

    defects = load_defects_json(base_dir)
    y_ticks_k = load_y_ticks_like_2d(base_dir)

    print(f"[3D] loaded defects: {len(defects)}")  # 调试用：看是否读到了

    plot_defects_categorical_z(
        amps_list=amps_list,
        x_labels=x_labels,
        total_time_seconds=total_time,
        defects=defects,
        y_ticks_k=y_ticks_k,   # 可选
        fig_size=(12.5, 8.2),
        view_elev=26,
        view_azim=-60,
    )



if __name__ == "__main__":
    try:
        main()
        print("DONE")
        sys.stdout.flush()
        sys.exit(0)
    except Exception as e:
        print("ERROR", repr(e))
        sys.stdout.flush()
        sys.exit(1)
