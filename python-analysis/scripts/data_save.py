from data_collect import *

def data_save(data, label, save_path, save_index):
    for i in range(len(label)):
        data_save_path = save_path + 'train/' + str(save_index) + '_ampdata.npy'
        label_save_path = save_path + 'label.csv'
        if nan_jug(data[i, :, :]):
            print('Nan !')
        print(data[i, :, :].shape, ' , label :', label[i])
        np.save(data_save_path, data[i, :, :])
        f = open(label_save_path,'a',newline='')
        csv_writer = csv.writer(f)
        csv_writer.writerow([str(save_index) + '_ampdata', label[i]])
        f.close()
        save_index += 1
    return save_index