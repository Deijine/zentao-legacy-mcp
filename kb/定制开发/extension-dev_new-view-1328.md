# 新增视图层(view/ui)

一、文件位置
 禅道的视图层在ui目录里编写，18系列版本的视图文件在view目录里，20版本的代码都是在ui目录进行编写。 
 还是以oa模块为例，新增一个browse页面，需要增加一个extension/custom/oa/ui/browse.html.php文件。 

二、代码编写
 之前禅道的视图文件直接使用PHP+原始HTML拼接进行渲染的，代码封装度不够、很多组件无法复用，导致开发效率低、页面风格不一致。为了解决这些问题，禅道视图层采用了新的组件式开发方式zin进行编写。
 具体的说明和写法请参阅zin的官方文档  https://openzui.com/zin/ (https://openzui.com/zin/)

一、zin命名空间

```
<?php
namespace zin;
```

 每个ui文件都需要首先声明命名空间zin。 

二、使用zin编写页面
 禅道的每个页面都是使用组件的方式进行开发的，每个组件都是一个PHP方法。以span标签为例： 

```
<span class="text-lg font-bold">示例</span>
```

 使用zin改为组件形式： 

```
span
(   
    '示例',
    setClass('text-lg font-bold')
);
```

三、基础组件
如果想了解禅道所有的基础组件，可以参阅组件的代码。所有内置组件代码都在 lib/zin/wg 目录下，比如dtable组件是在 lib/zin/wg/dtable。
在编写页面的过程中，可以参考禅道已有的相似页面，以便快速实现功能。

 禅道ui常见的基础组件有： 
 1. 表格列表 dtable
 2. 表单 formGridPanel 
 3. 模块树菜单 moduleMenu
 4. 功能菜单栏 featureBar 
 5. 右上角操作栏 toolbar 
 6. 左侧侧边栏 sidebar 
 7. 编辑器 editor
