from typing import Counter
import numpy as np


def dic_gen(point_pos, state_list):
    out_put = {}
    for i in range(len(state_list)):
        out_put[str(point_pos[i])] = state_list[i]
    return out_put

class Result_pool:
    def __init__(self, point_pos, default_state=0, num_event=4) -> None:
        super(Result_pool, self).__init__()
        self.point_pos =  [str(pos) for pos in point_pos]
        self.result_pool = {}
        for i in range(len(point_pos)):
            self.result_pool[str(point_pos[i])] = int(default_state)
        
        self.count_pool = {}
        for i in range(len(point_pos)):
            self.count_pool[str(point_pos[i])] = [1] + [0] * (num_event - 1)
        # self.memory_pool = {}
        # for i in range(len(point_pos)):
        #     self.memory_pool[str(point_pos[i])] = int(default_state)

    def update(self, new_list):
        for i in range(len(self.point_pos)):
            if new_list[i] < 100:
                pos = self.point_pos[i]
                self.count_pool[pos][new_list[i]] += 1
        
        for pos in self.count_pool.keys():
            self.result_pool[pos] = np.argmax(self.count_pool[pos])

    def output(self):
        return self.result_pool

if __name__ == '__main__':
    result_pool_ = Result_pool(point_pos=[1,2,3,4,5], count_num=3)
    result_pool_.update([0,0,1,1,2])
    result_pool_.update([0,0,1,1,2])


    # print(result_pool_.result_pool)
    # result_pool_.update([0,0,1,1,2])
    # print(result_pool_.result_pool)
    # result_pool_.result_pool = [0,0,100,100,200]
    # print(result_pool_.result_pool)            
                    
