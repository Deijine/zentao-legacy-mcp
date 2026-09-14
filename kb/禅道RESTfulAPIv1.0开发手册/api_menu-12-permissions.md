# 12系列菜单登记和权限维护

扩展禅道遇到的一个问题就是如何将自己增加的功能登记到菜单中以及如何维护权限，本篇文章来讲述如何来实现这个功能。 

### 一、如何登记菜单

#### 1、菜单的组成
禅道的导航菜单分为三个部分，顶部菜单、模块菜单、功能菜单。 

![](https://static.zentao.net/web/data/upload/201412/f_d3943575c63dd277f1246ecb51803a24.jpg)

#### 2、菜单的定义
菜单的代码定义是在zentao/module/common/lang/zh-cn语言文件中。我们来看下主菜单的定义。 

2.1 主导航菜单的定义
80 $lang->menu->my = '我的地盘|my|index';
81 $lang->menu->product = '产品视图|product|index';
82 $lang->menu->project = '项目视图|project|index';

83 $lang->menu->qa = '测试视图|qa|index';
我们来看下代码的含义：83 $lang->menu->qa = '测试视图|qa|index';
这行代码定义了测试视图的代码，其中的menu->qa定义的是菜单的键值，可以根据实际的模块定义。后面是使用竖线分开的三个参数，分别是菜单的文本，对应到模块和方法。这句话就表示要定义一个顶级菜单，文本是“测试视图”，链接到qa模块的index方法。 

2.2 模块菜单的定义
我们以产品视图的模块菜单为例：144 $lang->product->menu->list = '%s';
145 $lang->product->menu->story = array('link' => '需求|product|browse|productID=%s', 'subModule' => 'story');
155 $lang->product->menu->create = array('link' => '新增产品|product|create', 'float' => 'right');
158 $lang->productplan->menu = $lang->product->menu;
159 $lang->release->menu = $lang->product->menu;
这几行代码定义了产品视图模块的模块菜单，这里面出现了一些新的定义方法： 

2.2.1 使用数组来定义链接
 145 $lang->product->menu->story = array('link' => '需求|product|browse|productID=%s', 'subModule' => 'story'); 

这行代码对链接进行定义的时候，使用了数组，分别定义了两个元素，link和subModule。其中link多增加了一个参数字段：productID=%s，代表产品视图的“需求”菜单会链接到product模块的browse方法，传递的参数是productID=%s，其中的%s会被替换成当前的产品id。

2.2.2 使用subModuel来定义子模块。145 $lang->product->menu->story = array('link' => '需求|product|browse|productID=%s', 'subModule' => 'story');

subModule定义的是它的子模块，这个需要是用来保持菜单高亮使用。这样当访问到story模块的时候，还会保持“产品视图”这个定义菜单高亮。 

2.2.3 使用alias来定义方法别名 151 $lang->product->menu->view = array('link' => '概况|product|view|productID=%s', 'alias' => 'edit');

这个地方的alias代表product的edit页面和product的view页面是相同的，这样当编辑产品的时候，“概况”菜单还是会保持高亮的。 

2.2.4 定义菜单的位置 所有的菜单默认都是显示在左侧的，如果需要将菜单显示在右侧，则需要定义它的float参数。
 155 $lang->product->menu->create = array('link' => '新增产品|product|create', 'float' => 'right');

通过设置float参数，可以定义这个新增产品的链接显示在页面的右侧。 

2.3 功能菜单的定义

功能菜单是在每一个模块的视图文件里面打印的，其扩展方法和视图的扩展相同，后面会讲到这一点。 

#### 3、菜单顺序的定义
前面讲述的是禅道菜单的定义，下面来讲下禅道菜单顺序的定义。在common/lang/下面有一个menuOrder.php的文件，在这个文件中定义了每个菜单的显示顺序。 /* Sort of main menu. */
 $lang->menuOrder[5] = 'my';
 $lang->menuOrder[10] = 'product';
 $lang->menuOrder[15] = 'project';
 $lang->menuOrder[20] = 'qa';
 $lang->menuOrder[25] = 'doc';
 $lang->menuOrder[30] = 'report';
 $lang->menuOrder[35] = 'company';
 $lang->menuOrder[40] = 'admin';
 /* index menu order. */
 $lang->index->menuOrder[5] = 'product';
 $lang->index->menuOrder[10] = 'project';

#### 4、如何将自己的页面登记到菜单中
了解了禅道的菜单机制之后，做扩展就非常容易了。我们来说下步骤： 

1. 在module/common/ext/lang/zh-cn/下面创建一个文件，比如叫做abc.php(文件名可以任意定义) 
2. 在这个文件中加上自己的菜单就好了，比如禅道专业版本中的版本库菜单： $lang->menu->repo = '版本库|repo|browse';
 $lang->menuOrder[21] = 'repo';

 $lang->repo->menu->list = '%s' . $lang->arrow;
 $lang->repo->menu->browse = array('link' =>'浏览|repo|browse|repoID=%s', 'alias' => 'diff, log, view, revision, showsynccomment');
 $lang->repo->menu->settings = '设置|repo|settings|repoID=%s';
 $lang->repo->menu->delete = array('link' => '删除|repo|delete|repoID=%s', 'target' => 'hiddenwin');

$lang->repo->menu->create = array('link' => '新增版本库|repo|create|', 'float' => 'right'); 

#### 5、如何将外部链加到菜单中
假设我们要在禅道顶级菜单挂一个新浪的网址，并且要在新窗口打开这个网址。 
1、在module/common/ext/view下新建文件footer.sina.html.hook.php 
2、加入如下内容保存后，打开禅道即可看到顶级菜单出现新增的链接，并且是在新窗口打开的： 

```
<script> 
$(document).ready(function()
{
    $("#navbar ul.nav").append('<li><a id="menusina" href="http://www.sina.com.cn"  target="_blank">新浪</ a><\/li>');
});
</script>
```

### 二、如何维护权限

感谢网友“抬头看脚趾”的分享，转载自：http://blog.sina.com.cn/s/blog_40b223160101geq6.html 

本文将介绍如何对新增的module进行权限的设置。
 在禅道的开源版中，所有的控制（control）方法的权限都是通过在group/lang/resource.php进行分配控制的，（PS：默认所有的控制方法都是只有管理员可以访问），通过“组织=>权限”中的分配界面对每个用户进行访问权限的设置，如图。

![](https://static.zentao.net/web/data/upload/201807/f_7d93ae1112dd41732b308e943f99effa.png)

![](https://static.zentao.net/web/data/upload/201807/f_79f1f05e09f950718148353aedf4dd2f.png)

 为了能够使自己新增的模块(module)或在现有模块的基础上新增的控制(control)方法能够在界面中显示并分配权限，则需要对module/group/lang/resource.php进行扩展，以下以对menudemo模块的index控制方法为例介绍具体操作。

 1、在module/group/ext/lang/zh-cn/、module/group/ext/lang/zh-tw/、module/group/ext/lang/en/文件夹下分别建立menudemo.php文件
 2、在menudemo.php文件中加入以下代码(group/ext/lang/zh-cn/menudemo.php group/ext/lang/zh-tw/menudemo.php group/ext/lang/en/menudemo.php) 

```
<?php
$lang->resource->menudemo = new stdclass();
$lang->resource->menudemo->index = 'index'; 
```

![](https://static.zentao.net/web/data/upload/201702/f_0afa12cbda1c10f94bb31ecc87b1777d.jpg)

 3、界面显示名称声明
 在权限分配界面中，为了能够直观的查看到所分配的是什么权限，就必须先对显示名称进行声明。其声明操作一般都是在lang文件中进行。
 module/menudemo/lang/zh-cn.php 

```
$lang->menudemo->common = '导航Demo';
$lang->menudemo->index = '首页';
$lang->menudemo->methodOrder[5]  = 'index';
```

 其中 $lang->menudemo->methodOrder[5] = 'index';是为了控制显示的先后排序而定义的。
 zh-tw.php en.php分别也加入以上内容，否则当切换界面语言时，分配界面将无法显示信息。
