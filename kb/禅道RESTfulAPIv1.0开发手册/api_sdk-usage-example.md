# 调用SDK示例

#### 一、使用说明
本SDK文件中的方法调用，适用于禅道12版本（禅道开源版12.5.3、禅道企业版 4.1.3及以下版本适用）。
在其它PHP框架中调用此SDK文件，只需要把SDK文件放置在框架目录下，分配目录和本文件权限，能够url正常访问到即可。

#### 

#### 

#### 二、配置参数
以开源版一键安装包为例，找到xampp\zentao\sdk\php\zentao.php文件，修改配置参数。

![](https://static.zentao.net/web/data/upload/zentao/202107/f_b11c651da0fd6c8c356758b240697f85.png)

#### 三、新建一个模块
在xampp\zentao\module目录下，新建一个zentaosdk模块目录用于测试，再新建一个control.php文件。
将手册中的示例函数代码拷贝到 xampp\zentao\module\zentaosdk\control.php 中，形成如下的页面： 

![](https://static.zentao.net/web/data/upload/zentao/202107/f_a6d09e458ad187a6b9ef2bc3c2bd9543.png)

![](https://static.zentao.net/web/data/upload/zentao/202107/f_b85ddc4e25c348487d41468824466603.png)

#### 四、测试调用 使用管理员账号登录禅道系统，登录系统后，修改URL地址，来访问创建的zentaosdk模块，测试我们的调用是否成功。

![](https://static.zentao.net/web/data/upload/zentao/202107/f_97339cdf22f4bb624aba2d8297648a84.png)

![](https://static.zentao.net/web/data/upload/zentao/202107/f_772eaa9601a9ec1c428f6968fb3bee6d.png)
