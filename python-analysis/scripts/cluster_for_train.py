from fast_pytorch_kmeans import KMeans
import torch
from einops import rearrange
import numpy as np

        ## 用聚类+前后是否有车的条件判定来找车，先做找车模块，还是每N行进一次，然后找出存在车的小段，对这些小段进行识别，改变的只有每次进来的数据量，
        ## 其他的都没有改变，我不管车在哪，我只管每次进来的小段有哪些是有车的，只把有车的送入网络
        ## 全段被分成三类，A，B，C，随机抽取（或整体）分别计算cos(AB), cos(AC),cos(BC),若最大的一个大于阈值，则认为存在车
        ## 若存在车，选择平均值最大类内样本作为有车样本，进入下一步；另两个类分别为‘无车’和‘车未能持续 N 个时刻’
        ## 后续若需改进： 根据列车的连续性对‘Train mask’做过滤
        ## 关于模型自动更新：
            # 数据流程：
                # 采集-预处理-标准化-（存储，识别-可视化），边识别边存储，注意此时存下来的数据直接可以是个有pseudo label的数据集
            # 按照工务段的巡检车和人工作业标注结果，与pseudo label做对照，将识别错误的样本拉出来作为这一轮的新样本
            # f（新样本，老样本）混合成新的数据集，对现有模型做继续训练，f需要推敲一下，如何混合，以及老样本如何丢弃
        ## 由于模型结构基本固定，所以最佳的系统升级的方式是换设备，力求13个点的segment代表更小的段，以减小空间误差
        ## 需要验证一下当同样点数代表不同空间长度时，准确率依旧优秀：
            # 用桂林和知觉的不同空间分辨率的设备采下来的不同空间点密度的数据集做一个交叉验证，用桂林的模型eval知觉的数据集，看一下准确率
        ## 局部和全局的交互。加快前传，提升泛化。
        ## 使用Conv1d的依据：空间上更近的测量点理应具有更相似的振动分布
def tensor_normal(x):
    '''Normalalization inside of the subsegs, maintain the distribution of every instance'''
    return (x - x.mean(dim=1).unsqueeze(1)) * ((x.var(dim=1).unsqueeze(1) + 1e-6) ** -0.5)

def split_to_subseg(x, len_subseg):
    '''Input (N, d), Output Tensor(num_subseg, len_subseg, N)'''
    x = torch.tensor(abs(x))
    num_subseg = x.shape[1] // len_subseg
    x = x[:, 0 : num_subseg * len_subseg]
    x = rearrange(x, 'n ( d m ) -> m d n', m=num_subseg)
    return x

def mask_cluster(x, n_cluster=3, mode='euclidean', verbose=0, device='cpu', jug_dis=0.1):
    '''Input (N, m, d), including:
    (1) every m influenced by train
    (2) Some m influenced by train
    (3) None of m influenced by train 
    Output class mask (100,100,0,0,0...,100) for N, ONLY make (1) accessible
    Mask + preds Such like (108, 109, 3,1,4,4...,104), and Only the label obtained by the class dir can have a class'''
    kmeans = KMeans(n_clusters=n_cluster, mode=mode, verbose=verbose)  # Fast-KMeans oprated on GPU
    x = x.to(device=device, dtype=torch.float32)
    x = rearrange(x, 'N m d -> N ( m d )')
    labels = kmeans.fit_predict(x).tolist()  # Primary mask
    num_labels = x.shape[0]
    kind_labels = len(set(labels))
    labels_ele = list(set(labels))
    x = x.numpy()
    if kind_labels == 1: # 全无车 or 全有车， 无法无监督判别，舍弃
        labels = [100] * x.shape[0]
    if kind_labels == 2: # 车与无车之间一定夹着过渡，所以一定是（车+过渡）or （过渡+无车）
        label_0_data, label_1_data = [], []
        for i in range(num_labels):
            if labels[i]==labels_ele[0]:
                label_0_data.append(x[i])
            if labels[i]==labels_ele[1]:
                label_1_data.append(x[i])

        if (
            label_0_data.mean() > label_1_data.mean() and len(label_0_data) < len(label_1_data)
        ) or (
            label_1_data.mean() > label_0_data.mean() and len(label_1_data) < len(label_0_data)
        ):  # 大的占少数， 一定不是（车+过渡），必为（过渡+无车），直接全体mask
            labels = [100] * num_labels
        # 大的占多数， 一定是（车+过渡），而且多数一定是车，mask 掉少数lable
        if label_0_data.mean() > label_1_data.mean() and len(label_0_data) > len(label_1_data):
            for i in range(num_labels):
                if labels[i] == labels_ele[1]:
                    labels[i] = 100
                if labels[i] == labels_ele[0]:
                    labels[i] = 1
        if label_1_data.mean() > label_0_data.mean() and len(label_1_data) > len(label_0_data):
            for i in range(num_labels):
                if labels[i] == labels_ele[0]:
                    labels[i] = 100
                if labels[i] == labels_ele[1]:
                    labels[i] = 1
    if kind_labels == 3:
        scores = {}
        label_0_data, label_1_data, label_2_data = [], [], []
        for i in range(num_labels):
            if labels[i]==labels_ele[0]:
                label_0_data.append(x[i])
            if labels[i]==labels_ele[1]:
                label_1_data.append(x[i])
            if labels[i]==labels_ele[2]:
                label_2_data.append(x[i])
        scores['0 1'] = np.cos(np.matmul(np.array(label_0_data),np.array(label_1_data).T)).mean()
        scores['0 2'] = np.cos(np.matmul(np.array(label_0_data),np.array(label_2_data).T)).mean()
        scores['1 2'] = np.cos(np.matmul(np.array(label_1_data),np.array(label_2_data).T)).mean()
        _, min_related_value = min(scores.items(),key=lambda dict:dict[1]) # should belongs to train and no train
        max_related_key, _ = max(scores.items(),key=lambda dict:dict[1])    # should belongs to no train and inter

        if min_related_value  > 1 - jug_dis:    # 相关性不够小，认为无车,全体mask
            labels = [100] * num_labels
        if min_related_value  < 1 - jug_dis:    # 相关性足够小，有车
            no_train_inter_labels = [int(s) for s in max_related_key.split()]
            train_label = list(set(labels).difference(no_train_inter_labels))[0]
            for i in range(num_labels):
                if labels[i] == train_label:
                    labels[i] = 0
                else:
                    labels[i] = 100
    return labels


if __name__ == '__main__':
    # x = np.random.randn(512, 9021)
    x = np.random.randn(512, 9021)
    split_x = split_to_subseg(x, 90)
    print('Input size: ', x.shape)
    print('Split size: ', split_x.shape)
    mask = mask_cluster(split_x, n_cluster=3, mode='euclidean', verbose=0, device='cpu', jug_dis=0.1)
    print(mask)
    x = tensor_normal(split_x)
    print('Network input: ', x.shape)
    

# kmeans = KMeans(n_clusters=3, mode='euclidean', verbose=1)
# x = torch.randn(50000, 64, device='cpu')
# labels = kmeans.fit_predict(x)
# print(labels.shape)