# 使用MVC实现的hello world! - zentaoPHP框架手册

在上一章中，我们实现了简单的Hello world输出，在这一章里面，我们将向你展示如何利用mvc的结构来实现Hello world. 

#### 一、仅有control.php的hello world.
在上一个章节中，我们所实现的代码，实际上是在control里面直接输出了Hello world. 

```
<?php
class hello extends control
{
    public function world()
    {
        echo 'Hello world';
    }
}
```

#### 二、有model层的hello world.
现在稍微复杂一点，引入model。我们来创建model文件：model.php。  

```
<?php
class helloModel extends model
{
    public function world()
    {
        return 'Hello world!';
    }
}
```
 现在control需要做一些改动：   

```
public function world()
{
    echo $this->hello->world();
}
```
 框架会自动加载当前模块所对应的model类，并生成model对象，然后在control就可以通过$this->hello(也就是模块名)这样的形式来引用model中的各个方法了。
现在再来访问下http://localhost/zentaophp/hello-world，是不是同样可以显示出hello world!？ 

#### 三、带有view层的hello world.
zentaoPHP框架对模板的命名约定如下： 
1. 视图文件都存放在各个模块的view目录下面。
 2. 视图文件的命名规则是方法名+模板名+.php。比如我们要访问的index.html，那么对应的模板文件是index.html.php。 

首先我们来修改下control文件。  

```
public function world()
{
    $this->view->helloworld = $this->hello->world();
    $this->display();
}
```
  然后我们来创建view/world.html.php，内容如下

```
<?php
echo $helloworld;
?>
```

control将model返回的变量赋值到视图文件。然后调用display方法展示模板文件就可以了。 
ok，这时再重新刷新访问，是不是可以呢？ 
走到这一步，恭喜你，你已经接触到了ZenTaoPHP框架基础，核心的东西了。
