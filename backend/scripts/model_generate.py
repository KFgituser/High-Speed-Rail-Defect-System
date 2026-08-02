from model import *
from torch.nn import init
from conv1d_model import *

# 输入的每一个小段的测量点数=Tokens数量，tokens数量固定，根据tokens数量决定要划分多少个小段
# 小段数量 = 测量点总数/固定的tokens数量， 根据病害分布确定tokens数量，预先定义为M
# 每多少个点，做一次检测
def initNetParams(model):
    for m in model.modules():
        if isinstance(m, nn.Conv2d):
            init.kaiming_normal_(m.weight)
            if m.bias is not None:
                nn.init.constant_(m.bias, 0.1)
        elif isinstance(m, nn.BatchNorm2d):
            nn.init.constant_(m.weight, 1)
            nn.init.constant_(m.bias, 0)
        elif isinstance(m, nn.Linear):
            init.kaiming_normal_(m.weight)
            if m.bias is not None:
                nn.init.constant_(m.bias, 0.1)

class ModelGenerator():
    def __init__(self, row_per_detect, num_event, num_tokens):
        super(ModelGenerator, self).__init__()
        self.num_tokens = num_tokens
        self.in_channel = row_per_detect
        self.num_class = num_event
    
    def DetectModel_lite(self, dropout=0.2, pre_train=False, state_dir=None):
        args = {
            'in_channel' : self.in_channel, 'd_model' : 256, 'heads' : 8, 'dim_head' : 64, 'dropout' : dropout, 
            'num_tokens' : self.num_tokens, 'exp_ratio' : 4, 'num_blocks' : 2, 'class_exp' : 2, 'num_class' : self.num_class
        }
        model = DetecModel(**args)
        if pre_train:
            model.load_state_dict(torch.load(state_dir))
            print('Model loaded.')
        else:
            initNetParams(model)
            print('Model initialized.')
        return model

    def DetectModel_mid(self, dropout=0.3, pre_train=False, state_dir=None):
        args = {
            'in_channel' : self.in_channel, 'd_model' : 512, 'heads' : 8, 'dim_head' : 64, 'dropout' : dropout, 
            'num_tokens' : self.num_tokens, 'exp_ratio' : 4, 'num_blocks' : 4, 'class_exp' : 2, 'num_class' : self.num_class
        }
        model = DetecModel(**args)
        if pre_train:
            model.load_state_dict(torch.load(state_dir))
            print('Model loaded.')
        else:
            initNetParams(model)
            print('Model initialized.')
        return model
    
    def DetectModel_large(self, dropout=0.4, pre_train=False, state_dir=None):
        args = {
            'in_channel' : self.in_channel, 'd_model' : 512, 'heads' : 8, 'dim_head' : 64, 'dropout' : dropout, 
            'num_tokens' : self.num_tokens, 'exp_ratio' : 4, 'num_blocks' : 8, 'class_exp' : 2, 'num_class' : self.num_class
        }
        model = DetecModel(**args)
        if pre_train:
            model.load_state_dict(torch.load(state_dir))
            print('Model loaded.')
        else:
            initNetParams(model)
            print('Model initialized.')
        return model
    
    def DetectModel_custom(self, args, pre_train=False, state_dir=None):
        model = DetecModel(**args)
        if pre_train:
            model.load_state_dict(torch.load(state_dir))
            print('Model loaded.')
        else:
            initNetParams(model)
            print('Model initialized.')
        return model

class CNN_ModelGenerator():
    def __init__(self, in_channel, root_channel, num_class, stage1, stage2):
        super(CNN_ModelGenerator, self).__init__()
        self.stage1, self.stage2 = stage1, stage2
        self.in_channel, self.root_channel = in_channel, root_channel
        self.num_class = num_class
    
    def conv1d_model(self, dropout=0.2, pre_train=False, state_dir=None):
        args = {
            'in_channel' : self.in_channel, 'root_channel' : self.root_channel, 'num_class' : self.num_class,
            'stage1' : self.stage1, 'stage2' : self.stage2, 'dropout' : dropout
        }
        model = conv1d_model(**args)
        if pre_train:
            model.load_state_dict(torch.load(state_dir))
            print('Model loaded.')
        else:
            initNetParams(model)
            print('Model initialized.')
        return model


if __name__ == '__main__':
    print()
    print('########################## Inference Test ##########################')
    print()
    # model = ModelGenerator(row_per_detect=512, num_event=4, num_tokens=13).DetectModel_lite()
    model = CNN_ModelGenerator(in_channel=512, root_channel=64, num_class=100, stage1=6, stage2=4).conv1d_model(dropout=0.2, pre_train=False, state_dir=None)
    input_tensor = torch.randn(32, 13, 512)
    print(input_tensor.type())
    scores = model(input_tensor)
    print('Input Size: ', input_tensor.shape)
    print('Output Size: ', scores.shape)
    print()
    print('##########################                ##########################')
    print()
