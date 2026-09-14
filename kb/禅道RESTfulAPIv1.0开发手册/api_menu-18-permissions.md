# 18系列菜单登记和权限维护

本文主要讲解在禅道18系列及以上版本中，菜单登记、权限维护等常见问题。

### 1、如何在禅道中登记一个菜单？
模块：common
 目录：lang
 左侧主导航：   $lang->mainNav->$menuName
 顶部一级导航：$lang->$moduleName->menu->$menuName
 顶部二级导航：$lang->$moduleName->menu->$menuName['subMenu']
 扩展代码目录：zentaopms/extension/custom/common/ext/lang/zh-cn/demo.php 

### 2、新增方法后，如何支持配置权限？模块：group
 目录：lang
 写法：$lang->resource->$moduleName->$methodName = 语言项的Key;
 扩展代码目录：zentaopms/extension/custom/group/ext/lang/zh-cn/demo.php 

![](https://static.zentao.net/web/data/upload/zentao/202312/f_402a43186756a9ae019afbcb79962354.png)

### 3、多语言配置
zh-cn.php
 zh-tw.php
 en.php
 fr.php
 de.php
 vi.php 

### 4、数据校正校验数据验证：   add,setIF,setDefault,remove,join等
 数据库验证：check,batchCheck,autocheck等
 框架校验：   zentaopms/config/filter.php

### 5、如何设置某个字段为富文本形式？配置中写入：
 $config->bug->editor->create = array('id' => 'desc',  'tools' => 'simpleTools');
 $config->bug->editor->create = array('id' => 'desc',  'tools' => 'fullTools');

 视图中引入：
 $app->getModuleRoot() . 'common/view/kindeditor.html.php'

### 6、禅道中如何创建URL？PHP创建链接：
 $this->createLink('task'，'view', 'taskID=$taskID');
 helper::createLink('task', 'create', 'executionID=$executionID');

 JS创建链接：
 createLink ('task', 'edit', 'taskID=$taskID') ；

### 7、页面JS跳转/PHP跳转JS跳转：
 $link = createLink ('task', 'edit', 'taskID=$taskID') ；
 js::locate($link);

 PHP跳转：
 $link = $this->createLink ('task', 'edit', 'taskID=$taskID') ；
 $this->locate($link);

### 8、如何在禅道中写Ajax请求？

Var link = createLink('bug', 'ajaxGetProjects', 'productid=' + productID);
 $.post(link, function(data){
     //code…
 });

 $.get(link, function(data){
     //code…
 });
注：control中以ajax开头的方法不鉴权

### 9、如何在禅道中配置数据表格？在bug/config.php中配置：
 $config->bug->datatable->fieldList['id']['title']       = 'idAB';
 $config->bug->datatable->fieldList['id']['fixed']      = 'left';
 $config->bug->datatable->fieldList['id']['width']     = '70';
 $config->bug->datatable->fieldList['id']['required'] = 'yes’;

 页面引入：
 $app->getModuleRoot() . 'common/view/datatable.html.php';
 $app->getModuleRoot() . 'common/view/datatable.fix.html.php';

禅道权限进阶介绍，可以参考：https://devel.easycorp.cn/book/extension-new/priv-67.html (https://devel.easycorp.cn/book/extension-new/priv-67.html)
