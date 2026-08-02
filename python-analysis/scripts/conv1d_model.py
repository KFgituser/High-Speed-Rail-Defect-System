import torch
import torch.nn as nn
from einops import rearrange, repeat

class conv1d_bn_ac(nn.Module):
    "1d-cnn layer with bn and ac"
    def __init__(self, in_channel, out_channel, kernel, stride, padding):
        super(conv1d_bn_ac, self).__init__()
        self.in_channel, self.out_channel = in_channel, out_channel
        self.kernel, self.stride, self.padding = kernel, stride, padding
        self.conv1d = nn.Sequential(
            nn.Conv1d(self.in_channel, self.out_channel, self.kernel, self.stride, self.padding),
            nn.Hardswish(inplace=True),
            nn.BatchNorm1d(self.out_channel)
        )
    def forward(self, x):
        return self.conv1d(x)

class res_block(nn.Module):
    def __init__(self, in_channel, out_channel, inter_channel):
        super(res_block, self).__init__()
        self.in_channel, self.out_channel = in_channel, out_channel
        self.inter_channel = inter_channel
        self.conv = nn.Sequential(
            conv1d_bn_ac(self.in_channel, self.inter_channel, 1, 1, 0),
            conv1d_bn_ac(self.inter_channel, self.inter_channel, 3, 1, 1),
            conv1d_bn_ac(self.inter_channel, self.out_channel, 1, 1, 0),
        )
        if self.in_channel == self.out_channel:
            self.shortcut = nn.Sequential()
        else:
            self.shortcut = conv1d_bn_ac(self.in_channel, self.out_channel, 1, 1, 0)
    def forward(self, x):
        return self.shortcut(x) + self.conv(x)


class conv1d_model(nn.Module):
    def __init__(self, in_channel, root_channel, num_class, stage1, stage2, dropout):
        super(conv1d_model, self).__init__()
        self.p = dropout
        self.in_channel, self.num_class = in_channel, num_class
        self.stage1, self.stage2 = stage1, stage2
        self.root_channel = root_channel
        self.inter = root_channel
        self.conv_root = conv1d_bn_ac(self.in_channel, self.root_channel, 3, 1, 1)
        self.layers = []
        self.layers.append(res_block(self.inter, 512, 128))
        self.inter = 512
        for _ in range(self.stage1 - 1):
            self.layers.append(res_block(self.inter, self.inter, 128))
        self.layers.append(res_block(self.inter, 1024, 256))
        self.inter = 1024
        for _ in range(self.stage2 - 1):
            self.layers.append(res_block(self.inter, self.inter, 256))
        self.stages = nn.Sequential(*self.layers)
        self.bn = nn.BatchNorm1d(1024)
        self.pool = nn.AdaptiveAvgPool1d(1)
        self.mlp = nn.Sequential(
            nn.Linear(1024, 1024),
            nn.Dropout(p=self.p),
            nn.BatchNorm1d(1024),
            nn.Hardswish(inplace=True)
        )
        self.fc = nn.Linear(1024, self.num_class)

    def forward(self, x):
        x = self.conv_root(x.permute(0,2,1))
        x = self.stages(x)
        x = self.bn(x)
        x = self.pool(x).squeeze()
        x = self.mlp(x)
        return self.fc(x)