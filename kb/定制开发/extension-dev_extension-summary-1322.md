# 禅道扩展机制简介

###  背景介绍 
 禅道软件的定制开发通常需要对已有代码进行修改或增加新功能。市面上大多数开源软件在进行二次开发后只能停留在特定版本,升级时往往需要重新开发。虽然像WordPress、Drupal等知名软件开发了Hook机制来解决这个问题,但这种基于事件的扩展方式只能进行局部修改,难以实现深度定制。 

###  禅道的解决方案 
 为解决这个问题,禅道在设计时特别注重框架的扩展性,实现了一套完整的扩展机制,为开发者提供更大的定制自由度。 

###  核心架构 
 禅道的功能由独立模块组成,每个模块对应module目录下的一个子目录(如project、user等)。每个模块采用MVC架构： 
-  Control(控制层) 
-  Model(模型层) 
-  View/UI(视图层) 
辅助组件
 除基本MVC结构外,还包含： 
-  Config(配置) 
-  Lang(语言) 
-  CSS(样式) 
-  JS(脚本) 
-  Zen(控制层子层) 
-  Tao(模型层子层) 
扩展目录说明
 禅道的extension目录用于存放扩展代码： 

```
extension/
├── biz/      # 企业版
├── max/      # 旗舰版
├── ipd/      # IPD版本
└── custom/   # 二次开发专用目录
```
 所有定制开发的代码都应维护在extension/custom目录下。 

开发指南
 定制开发通常分为新增模块和修改已有模块，我们来看下代码分别是怎么组织的： 

1. 比如新增一个oa模块，所有代码都需要在extension/custom/oa目录下编写：

```
extension/custom/oa/control.php
extension/custom/oa/model.php
extension/custom/oa/view/{metho1.html.php, method2.html.php, ...}
extension/custom/oa/config/config.php
extension/custom/oa/css/{method1.css, method2.css, common.css, ...}
extension/custom/oa/js/{method1.js, method2.js, common.js, ...}

```

2. 修改禅道已有的user模块，扩展代码的目录结构如下：

```
extension/custom/user/ext/control/{method1.php, method2.php, ...} 
extension/custom/user/ext/model/{extend1.php, extend2.php, ...}
extension/custom/user/ext/view/{method1.html.php, method2.html.php, ...}
extension/custom/user/ext/config/{config1.php, config2.php, ...}
extension/custom/user/ext/lang/zh-cn/{lang1.php, lang2.php, ...}
extension/custom/user/ext/lang/en/{lang1.php, lang2.php, ...}
extension/custom/user/ext/css/method1/{1.css, 2.css, ...}
extension/custom/user/ext/js/method1/{1.js, 2.js, ...}
```

###  两种方式的主要区别 
-  修改现有模块需要在ext子目录下进行 
-  新模块的所有方法集中在一个文件或目录,而修改现有模块则在单独的文件或目录中进行 

重要命名规范
新增加的模块名和control层的文件名必须使用小写命名。
扩展机制的优势
-  扩展代码与主干代码物理隔离 
-  系统升级不会覆盖扩展代码 
-  支持深度定制 

###  扩展机制的局限性 
-  扩展机制只能保证代码不被覆盖,不能保证功能始终不受影响 
-  当主干功能发生变化时,依赖该功能的扩展代码可能需要调整 
最佳实践建议
-  定期关注系统更新 
-  系统升级后及时测试扩展功能 
-  做好扩展代码的文档记录 
-  严格遵循目录规范
