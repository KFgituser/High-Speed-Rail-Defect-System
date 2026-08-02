import numpy as np
def scratch_label_gen(
    start_mile = 1152864, end_mile = 1138464, measure_point = 2600,
    diseases_type = ['No-event', 'Break', 'Crevice', 'Bulge'], diseases_label = [0, 1, 2, 3],
        real_world_dic=None
):

    if real_world_dic is None:
        real_world_dic = {
            '1138520': 2, '1141910': 1, '1146137': 2, '1148600': 1, '1151400': 2,
            '1152800': 2, '1138900': 3, '1139200': 3, '1139520': 3,
            '1139725': 3, '1140450': 3, '1140870': 3, '1141190': 3, '1141560': 3,
            '1142904': 3, '1147120': 3, '1147711': 3, '1148237': 3, '1148913': 3,
            '1149102': 3, '1149200': 3, '1150200': 3, '1152685': 3
        }
    real_world_dis = abs(start_mile - end_mile)
    diseases_qurey = {}
    for i in range(len(diseases_type)):
        diseases_qurey[str(diseases_label[i])] = diseases_type[i]

    measure_point_label_dic = {}
    for k,v in real_world_dic.items():
        abs_dis = abs(int(k) - start_mile)
        point_res = int(abs_dis * (measure_point / real_world_dis))
        measure_point_label_dic[str(point_res)] = v

    return measure_point_label_dic, diseases_qurey





