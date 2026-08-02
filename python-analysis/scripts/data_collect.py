import os
import numpy as np
from cluster_for_train import *
from external_excel_true_position_label import *
import csv

def nan_jug(x):
    jug = x != x
    if jug.sum() != 0:
        return True

# 关于病害，目前假设的是单个样本对应单个病害，只要有病害了，就会有公务人员去复查，只要做出标定就可以
# 随着日后的设备增加：
# 单个设备的覆盖里程变短，频率不变，点密度增加，同样样本点数对应的空间变短；
# 单个点的采样频率上升，频率上升，点密度不点，单个样本同样信息密度下所需的点数变少；
# 上述两个方面都可以在不改变算法模型的基础上改进空间准确度。
# 目前单个样本13个点，75m是考虑达成初步收敛，之后再从设备做改进，或者从13个点尝试逐步减少，观察准确率和是否能够收敛。

# Next: 如何获得真实位置：label标签的dic for disease_position

disease_position, disease_query = scratch_label_gen()

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
        try:
            if (raw_data[train_index[i] - 2] > raw_data[train_index[i]] * jug_ratio) and (raw_data[train_index[i] + 2] > raw_data[train_index[i]] * jug_ratio) and \
            (raw_data[train_index[i] - 4] > raw_data[train_index[i]] * jug_ratio) and (raw_data[train_index[i] - 4] > raw_data[train_index[i]] * jug_ratio) and\
            (raw_data[train_index[i] - 6] > raw_data[train_index[i]] * jug_ratio) and (raw_data[train_index[i] - 6] > raw_data[train_index[i]] * jug_ratio):
                out_put_index.append(train_index[i])
        except:
            pass
    return out_put_index

def disease_list_gen(disease_position, true_len, mask_len):
    '''Disease_position: {'point_position' : label_num}, point_position is the True measure point'''
    trans_dic = {}
    ratio = mask_len / true_len
    for k,v in disease_position.items():
        k_ = int(int(k) * ratio)
        trans_dic[str(k_)] = v
    return trans_dic

def collect_data(raw_data_, train_mask, disease_list):
    '''raw_data_ (n, l, d) numpy, train_mask: list, diseadse_list: dic, mask_position : label'''
    '''disease_list including disease only, label from 1, and in this function, position not included in disease_list will be labeled 0'''
    '''Specially: n = mask_len'''
    '''Output : [[x] x N], [y x N], can be [], []'''
    data_stack = []
    label_stack = []
    example_num = len(train_mask)
    for i in range(example_num):
        if train_mask[i] < 100:
            data_stack.append(raw_data_[i,:,:])
            if str(i) not in disease_list.keys():
                label_stack.append(0)
            else:
                label_stack.append(disease_list[str(i)])
    return data_stack, label_stack


def data_collect(row_per_detect, len_subsegment, root_path='D:/JingHu_Data/', disease_position=None, save_path=None):
    save_index = 0
    dirs = os.listdir(root_path)
    for file in dirs:
        data_now = abs(np.load(root_path + str(file), allow_pickle=True))
        raw_data = np.zeros((row_per_detect, data_now.shape[1]))
        j = 0
        for i in range(len(data_now)):
            raw_data[j, :] = data_now[i, :]
            j += 1
            if (j + 1) == row_per_detect:
                j = 0
                raw_data_ = split_to_subseg(raw_data, len_subsegment)
                mask_len =  raw_data.shape[1] // len_subsegment
                raw_data_ = tensor_normal(raw_data_) # (n, l, d)
                raw_data_ = raw_data_.numpy()
                
                train_index = amp_train_track(raw_data.mean(axis=0), jug_ratio=0.2)
                if train_index == []:
                    train_mask = [100] * (raw_data.shape[1] // len_subsegment)
                else:
                    train_mask = amp_mask_gen(train_index, mask_len, data_now.shape[1], 4)
                disease_list = disease_list_gen(disease_position, data_now.shape[1], mask_len) # True point to mask position
                data_selected, label = collect_data(raw_data_, train_mask, disease_list) # train_mask for collect, disease_list for label, 选出本次积累中的有车通过的数据[[x] x N], [y x N]
                if label != []:
                    for sample in range(len(label)):
                        data_save_path = save_path + 'train/' + str(save_index) + '_ampdata.npy'
                        label_save_path = save_path + 'label.csv'
                        if nan_jug(data_selected[sample]):
                            print('Nan !')
                        np.save(data_save_path, data_selected[sample])
                        f = open(label_save_path,'a',newline='')
                        csv_writer = csv.writer(f)
                        csv_writer.writerow([str(save_index) + '_ampdata',label[sample]])
                        f.close()
                        save_index += 1

if __name__ == '__main__':
    data_collect(
        512, 13, 
        root_path='D:/JingHu_Data/', 
        disease_position=disease_position, save_path='./dataset/'
    )
