# 新增控制层(control/zen)

## 一、控制层 control

文件位置
新增模块的控制层首先需要在 extension/custom/xxx 目录下新增一个 control.php 文件。
 以oa模块为例，需要新增一个 extension/custom/oa/control.php 文件。 

代码编写
 在control.php文件里声明一个与模块同名的类，继承自control类。control类是禅道框架的基础类，可以在framework/control.class.php查看具体实现。 
 比如oa模块： 

```
<?php
class oa extends control
{
    public function browse()
    {
        $this->view->header->title = 'getsid';
        $this->view->todoList = array();
        $this->view->test = $this->misc->test();
        $this->display();
    }
} 
```

#####  1. 方法即路由 
 比如oa的browse方法，对应浏览器访问的路由就是 /index.php?m=oa&f=browse 

##### 2. 通过view变量向视图层传递数据
 $this->view->todoList = array(1, 2, 3); 
 在视图层，我们可以直接使用$todoList变量。 
3. display方法
 control层调用display方法渲染对应的视图文件，即 extension/custom/oa/ui/browse.html.php 或者 extension/custom/oa/view/browse.html.php

## 二、控制子层 zen
 zen层是禅道20版本之后增加的新的逻辑分层，主要解决的是control层代码臃肿，将control层的子逻辑放在zen层。注意：zen层是可选的。

文件位置
新增模块的zen层需要在 extension/custom/xxx 目录下新增一个 zen.php 文件，比如 extension/custom/oa/zen.php。 

代码编写
 在zen.php文件里声明一个名为 模块名 + 'Zen' 的类，继承自该模块的control类，比如oa模块就继承上面control层增加的oa类。 
 因此zen跟control一样可以调用model的方法 

```
<?php
class oaZen extends oa
{
    public function getList()
    {
        return $this->oa->getTodoList();
    }
} 
```
 control层可以通过诸如 $this->oaZen->getList(); 的方式调用 zen层的方法。 

## 三、限制
 由于框架加载机制的限制，每个模块只能有一个control类和zen类。
