# -*- coding: utf-8 -*-
"""
surface_3d_with_defects.py
将 2D 的振幅序列按时间堆叠为曲面，并把病害点(时间×里程×类别)投到 3D 上。

"""
import os
import numpy as np
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from matplotlib.lines import Line2D
import matplotlib.patches as mpatches
from matplotlib.legend_handler import HandlerPatch
from mpl_toolkits.mplot3d.art3d import Poly3DCollection # 棱锥

# -------------------- 路径：相对脚本目录（稳定，不受运行目录影响） --------------------
SCRIPT_DIR = Path(__file__).resolve().parent
# 可选：用环境变量指定数据目录；不设置则默认脚本同目录
DEFAULT_DATA_DIR = Path(r"D:\JH_Codebase王舒伦\output")


# -------------------- 样式 & 工具 --------------------
DEFECT_COLORS = {'破损': 'g', '裂纹': 'r', '斜裂纹': 'orange', '冒浆': 'b'}  # 中文图例颜色
DEFECT_ORDER = ['破损', '裂纹', '斜裂纹', '冒浆']
DEFECT_LABELS = {
    'zh': {'破损': '破损', '裂纹': '裂纹', '斜裂纹': '斜裂纹', '冒浆': '冒浆'},
    'en': {'破损': 'Damage', '裂纹': 'Crack', '斜裂纹': 'Diagonal crack', '冒浆': 'Mud jacking'},
}


def current_lang():
    return 'en' if os.environ.get('VIZ_LANG', 'zh').lower().startswith('en') else 'zh'


def defect_label(name):
    return DEFECT_LABELS[current_lang()].get(name, name)

def parse_km(val):
    """将 'K1149+076' / 'k1149+076' / 1149.076 等转成浮点公里数 1149.076"""
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip().upper().replace('Ｋ', 'K').replace('＋', '+')
    if s.startswith('K'):
        rest = s[1:]
        if '+' in rest:
            k, m = rest.split('+', 1)
            return float(k) + float(m) / 1000.0
        return float(rest)
    # 兜底：尝试直接转浮点
    return float(s)
# 棱锥
def _add_pyramid_arrow(ax, tip_xyz, dir_vec, length, radius, color):
    """
    在 3D 中画一个三棱锥箭头：
    - tip_xyz: 箭头尖端 (x,y,z)
    - dir_vec: 箭头朝向向量 (dx,dy,dz)
    - length : 箭头长度
    - radius : 底面半径（越大越“胖”）
    """
    import numpy as np
    v = np.asarray(dir_vec, dtype=float)
    nv = np.linalg.norm(v)
    if nv == 0:
        return
    u = v / nv  # 方向单位向量

    # 在于 u 垂直的平面里构造正三角形的两个基向量
    # 选一个不平行的参考向量做 Gram-Schmidt
    ref = np.array([0.0, 0.0, 1.0]) if abs(u[2]) < 0.9 else np.array([0.0, 1.0, 0.0])
    a = ref - np.dot(ref, u) * u
    na = np.linalg.norm(a)
    if na == 0:
        return
    a /= na
    b = np.cross(u, a)  # 与 u、a 都垂直

    tip = np.asarray(tip_xyz, dtype=float)
    base_center = tip - u * length

    # 正三角形底面三个点（绕 base_center）
    # 取 0°, 120°, 240° 方向
    p1 = base_center + radius * a
    p2 = base_center + radius * (-0.5 * a + (3**0.5 / 2.0) * b)
    p3 = base_center + radius * (-0.5 * a - (3**0.5 / 2.0) * b)

    # 三个侧面三角形（不画底面，以免遮挡）
    faces = [
        [tip, p1, p2],
        [tip, p2, p3],
        [tip, p3, p1],
    ]
    coll = Poly3DCollection(faces, facecolor=color, edgecolor=color, linewidths=0.5)
    ax.add_collection3d(coll)

def _nearest_index(arr_1d, val):
    arr_1d = np.asarray(arr_1d)
    return int(np.abs(arr_1d - val).argmin())

def _load_or_demo(data_dir=None, allow_demo=True):
    """加载 npy；若不存在则造演示数据。返回 (amps_list, x_labels, total_time_seconds)."""
    base = Path(data_dir).expanduser() if data_dir else DEFAULT_DATA_DIR
    amps_p = base / "amps_stack.npy"
    labels_p = base / "x_labels.npy"

    if amps_p.exists() and labels_p.exists():
        arr = np.load(amps_p, allow_pickle=True)
        if arr.dtype == object:
            amps_list = [np.asarray(x, dtype=float) for x in arr.tolist()]
        else:
            amps_list = [arr[i, :].astype(float) for i in range(arr.shape[0])]
        x_labels = np.load(labels_p, allow_pickle=True)
        # 2D 的总时长常为 6 秒；如需一致可改这里
        return amps_list, x_labels, 6.0

    if not allow_demo:
        raise FileNotFoundError(f"缺少数据文件：{amps_p} 或 {labels_p}")
    Nt, Ny = 48, 96
    x_labels = np.linspace(1138.0, 1154.0, Ny)
    amps_list = []
    for i in range(Nt):
        n = 0.02 * np.random.randn(Ny)
        g1 = np.exp(-0.5*((np.linspace(-3, 3, Ny) - (i*0.05))**2)) * (0.7 + 0.3*np.sin(i*0.25))
        g2 = np.exp(-0.5*((np.linspace(-3, 3, Ny) - (2.0 - i*0.04))**2)) * (0.6 + 0.4*np.cos(i*0.18))
        amps_list.append((n + 0.35*g1 + 0.28*g2).astype(float))
    return amps_list, x_labels, 6.0

# -------------------- 主函数：画 3D 曲面 + 病害点 --------------------
def plot_surface_with_defects(
    amps_list, x_labels, total_time_seconds=6.0,
    z_clip=None, smooth_sigma=0.0, upsample=1,
    defects=None, defect_on_top=True, defect_size=50, defect_alpha=0.95,
    view_elev=24, view_azim=-58, fig_size=(12.8, 7.2),
    train_tracks=None

):
    """
    amps_list: list[np.ndarray(Ny,)]  时间顺序的一帧一条振幅
    x_labels : np.ndarray(Ny,)        里程刻度（真实值或索引）
    total_time_seconds: float         总时长（需与 2D 一致）
    z_clip: float|None                裁剪幅值极端值（如 1.0）
    smooth_sigma: float               高斯平滑强度(0=不平滑)
    upsample: int                     上采样倍率(1=不加密)
    defects: list[dict]               病害点（见函数注释头）
    defect_on_top: bool               点是否悬浮在曲面上方一点

    """

    #显示中文
    global Line2D
    plt.rcParams['font.sans-serif'] = ['SimHei']  # 或者 ['Microsoft YaHei'] / ['Arial Unicode MS']
    plt.rcParams['axes.unicode_minus'] = False



    assert len(amps_list) > 0, "amps_list 为空"
    # —— 对齐长度 ——（取最短）
    Ny = min(len(a) for a in amps_list)
    amps_list = [np.asarray(a)[:Ny] for a in amps_list]
    Nt = len(amps_list)

    # —— X(里程) & Y(时间) 轴 ——
    x_labels = np.asarray(x_labels)[:Ny]
    mileage = np.array([parse_km(x) for x in x_labels], dtype=float)
    time = np.linspace(0.0, total_time_seconds, Nt)
    # —— 组装 Z ——（列堆叠）
    Z = np.column_stack(amps_list)  # (Ny, Nt)

    # 若是降序，翻转并同步 Z（里程维度在行）
    if mileage[0] > mileage[-1]:
        mileage = mileage[::-1]
        Z = Z[::-1, :]
    time = np.linspace(0.0, total_time_seconds, Nt)

    # —— 组装 Z ——（列堆叠）

    """
    Amplitude Matrix Stacking
    每一帧（一个时间点），都会得到一条“里程 → 振幅”的曲线。把所有帧依次堆叠，就形成了一个二维矩阵：
        行：不同的里程位置
        列：不同的时间点
        数值：某一时刻某一里程点的振幅
    “振幅矩阵堆叠”就是把每一帧的振幅曲线按时间顺序拼在一起，形成一个二维表格（矩阵），再把这个表格当成 3D 图的高度图来画曲面。
    最高点（最大振幅）  表示在所有里程、所有时间里，振动最强的位置和时刻。这里的动态反应最强，需要重点关注。
    最低点（最小振幅）  表示在所有里程、所有时间里，振动最弱的位置和时刻。
    """

    Z = np.column_stack(amps_list)  # (Ny, Nt)

    # 裁剪
    if z_clip is not None:
        Z = np.clip(Z, -abs(z_clip), abs(z_clip))

    # 平滑曲面
    if smooth_sigma and smooth_sigma > 0:
        try:
            from scipy.ndimage import gaussian_filter
            Z = gaussian_filter(Z, sigma=smooth_sigma)
        except Exception:
            pass  # 没装 scipy 也能跑

    # 上采样 上采样后，里程和时间都被插值为更细的点数 让原始曲面更平滑。
    if upsample and upsample > 1:
        # 先在两个轴线性插值加密
        Ny2, Nt2 = Ny*upsample, Nt*upsample
        x_new = np.linspace(mileage.min(), mileage.max(), Ny2)
        t_new = np.linspace(time.min(), time.max(), Nt2)
        # 分两次 1D 插值避免依赖 scipy.interpolate
        Zx = np.vstack([np.interp(x_new, mileage, Z[:, j]) for j in range(Nt)]).T  # (Ny2, Nt)
        Z  = np.column_stack([np.interp(t_new, time, Zx[i, :]) for i in range(Ny2)])  # (Ny2, Nt2)
        mileage, time = x_new, t_new
        Ny, Nt = Ny2, Nt2

    # —— 绘图 ——
    fig = plt.figure(figsize=fig_size, dpi=150)
    ax = fig.add_subplot(111, projection='3d')
    fig.subplots_adjust(left=0.03, right=0.86, bottom=0.08, top=0.98)

    # 网格（注意 meshgrid 输出是 (Nt, Ny)）
    M, T = np.meshgrid(mileage, time)  # M.shape == T.shape == (Nt, Ny)

    # —— 统一对齐 Z 的朝向 ——
    if Z.shape == M.shape:
        Z_plot = Z
    elif Z.T.shape == M.shape:
        Z_plot = Z.T
    else:
        NyM, NtM = M.shape[1], M.shape[0]
        if Z.shape != (NyM, NtM) and Z.T.shape != (NyM, NtM):
            raise ValueError(f"Z shape {Z.shape} not compatible with meshgrid {M.shape}.")
        Z_plot = Z if Z.shape == (NtM, NyM) else Z.T

    # —— 绘制曲面 ——
    surf = ax.plot_surface(
        M, T, Z_plot,
        linewidth=0, antialiased=True, shade=True, alpha=0.9, cmap='inferno'
    )

    # 添加颜色条
    # 手动开一个 colorbar 的小区域： [left, bottom, width, height]
    cax = fig.add_axes([0.86, 0.18, 0.018, 0.62])
    cbar = fig.colorbar(surf, cax=cax)
    cbar.set_label("Amplitude Matrix Stacking", fontsize=29)
    # 颜色条刻度字体大小（变大）
    cbar.ax.tick_params(labelsize=27)
    x_min, x_max = float(mileage.min()), float(mileage.max())
    y_min, y_max = float(time.min()), float(time.max())
    z_min, z_max = float(Z.min()), float(Z.max())
    ax.set_xlim(x_min, x_max)
    ax.set_ylim(y_min, y_max)
    ax.set_zlim(z_min, z_max)



    # —— 病害点（仅底部圆点） ——
    if defects:
        z_base = ax.get_zlim()[0]

        for d in defects:
            # 计算坐标/索引
            if 'm_idx' in d and 't_idx' in d:
                mi, ti = int(d['m_idx']), int(d['t_idx'])
                if not (0 <= mi < Ny and 0 <= ti < Nt):
                    continue
                x, y = mileage[mi], time[ti]
            else:
                mv = d.get('mileage', d.get('x', None))
                tv = d.get('time_s', d.get('t', None))
                if mv is None or tv is None:
                    continue
                mi = _nearest_index(mileage, float(mv))
                ti = _nearest_index(time, float(tv))
                x, y = mileage[mi], time[ti]

            color = DEFECT_COLORS.get(d.get('cls', ''), 'k')

            # 只在底部平面画“圆点”
            ax.scatter(
                x, y, z_base,
                s=defect_size,  # 继承你原来的大小
                c=color,
                alpha=0.9,  # 稍微高一点更清晰
                marker='o',  # 圆点
                depthshade=False
            )


        # 中文图例（含“列车经过”占位）
        class HandlerArrow(HandlerPatch):
            def create_artists(self, legend, orig_handle,
                               xdescent, ydescent, width, height, fontsize, trans):
                arrow = mpatches.FancyArrow(
                    xdescent, ydescent + height / 2.0,  # 起点
                    width, 0,  # 终点（水平箭头）
                    width=0.05,  # 线条宽度
                    head_width=0.3 * height,  # 箭头宽度
                    head_length=0.25 * width,  # 箭头长度
                    length_includes_head=True,
                    color=orig_handle.get_edgecolor()
                )
                return [arrow]





    # —— 坐标轴 & 视角 ——（斜体标签）
    # 轴标签（
    ax.set_xlabel('Mileage (K+xxx)', fontsize=32, labelpad=58)
    ax.set_ylabel('Time (s)', fontsize=32, labelpad=18)
    ax.set_zlabel('Amplitude Matrix Stacking', fontsize=32, labelpad=23)
    for lab in (ax.xaxis.get_label(), ax.yaxis.get_label(), ax.zaxis.get_label()):
        lab.set_fontstyle('italic')
    # 指定想要的刻度标签
    from matplotlib.ticker import MaxNLocator, FuncFormatter

    # 1) 让主刻度数量自适应（通常 4~7 个）
    ax.xaxis.set_major_locator(MaxNLocator(nbins=6, min_n_ticks=4, prune=None))

    # 2) 把数值公里 → "Kxxxx+xxx" 文本
    def _fmt_km_to_K(x, _pos=None):
        k = int(np.floor(x))
        m = int(round((x - k) * 1000))
        # 规避四舍五入进位造成的 1000
        if m >= 1000:
            k += 1
            m = 0
        return f"K{k}+{m:03d}"

    ax.xaxis.set_major_formatter(FuncFormatter(_fmt_km_to_K))

    # 3) 标刻度外观：旋转、间距
    ax.tick_params(axis='x', pad=7, labelsize=28)
    ax.tick_params(axis='y', pad=8, labelsize=28)
    ax.zaxis.set_tick_params(pad=11, labelsize=27)

    for lbl in ax.get_xticklabels():
        lbl.set_rotation(16)
        lbl.set_ha('right')
    return fig

# -------------------- 示例入口 --------------------
def main():
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--data_dir", required=True, help="包含 amps_stack.npy 和 x_labels.npy 的目录")
    ap.add_argument("--out", required=True, help="输出 PNG 的完整路径")
    ap.add_argument("--z_clip", type=float, default=0.8)
    ap.add_argument("--smooth_sigma", type=float, default=1.0)
    ap.add_argument("--upsample", type=int, default=3)
    ap.add_argument("--view_elev", type=float, default=24)
    ap.add_argument("--view_azim", type=float, default=-63)
    ap.add_argument("--lang", default=os.environ.get("VIZ_LANG", "zh"))
    args = ap.parse_args()
    os.environ["VIZ_LANG"] = args.lang

    data_dir = Path(args.data_dir).expanduser().resolve()
    out_path = Path(args.out).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"[PY] data_dir={data_dir}")
    print(f"[PY] out={out_path}")
    amps_list, x_labels, total_time = _load_or_demo(data_dir=str(data_dir), allow_demo=False)
    defects = None

    fig = plot_surface_with_defects(
        amps_list, x_labels,
        total_time_seconds=total_time,
        z_clip=0.8,         # 如需抑制极端尖峰可设 0.8 / 1.0 等
        smooth_sigma=args.smooth_sigma,    # >0 开启高斯平滑(需安装 scipy)
        upsample=args.upsample,          # >1 线性上采样(不依赖 scipy)
        defects=defects,
        defect_on_top=True,
        defect_size=60,
        defect_alpha=0.95,
        view_elev=args.view_elev,
        view_azim=args.view_azim,
        fig_size=(24, 18),

    )

    # 关键：保存图片
    fig.savefig(out_path, dpi=200)
    plt.close(fig)
    print(f"[PY] Saved: {out_path}")

if __name__ == "__main__":
    main()
