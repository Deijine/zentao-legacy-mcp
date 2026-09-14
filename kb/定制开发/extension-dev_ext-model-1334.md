# 对模型层(model/tao)扩展

## 一、模型层 model
 model为模型方法，主要用来处理各种数据的查询、更新。model的扩展分为三种方式，一种是直接新增或者覆盖方法，一种是通过钩子来实现，第三种则是完全定义一个新的类，下面分别来讲述下各自实现的机制。 

#####  直接新增或者覆盖方法 
不管是新增方法还是覆盖现有的方法，都是在extension/custom目录下创建该模块目录，并在ext/model/目录下面建立相应的以方法为名的文件。比如，我们打算对misc的model新增一个方法，叫做foo，那么只需要在extension/custom/misc/ext/model/下面建立foo.php，代码如下： 

```
public function foo()
{ 
     return 'foo';
} 
```
需要说明的是这里面的定义不包含类的声明，就只是一个方法的声明。禅道框架在执行的时候，会自动将扩展目录下面的foo.php里面的代码，替换misc/model.php中的foo方法的代码。如果是新增的方法，则会追加到misc/model.php的代码中，最终生成一个合并之后的model类文件。

#####  二、通过钩子来扩展 
 除了新增或者覆盖方法之外，还可以通过钩子方式来扩展。所有的钩子都是存放在ext/model/hook目录下面，文件命名规则是：方法名.扩展名.php 
 比如我对misc模块中的helllo方法进行钩子的扩展，在misc/ext/model/hook/下面创建hello.abc.php的文件，然后在里面实现代码就可以了。 
 禅道框架会把某一个方法的所有的钩子代码合并到终的代码中。 
不过这种方法有很多限制，会有意想不到的行为，不建议大家使用。

#####  三、通过类的方式来扩展 
 除了上面两种方式之外，model的扩展还有第三种方式，就是将所有的扩展放在一个类里面，然后通过框架的loadExtension()方法来加载。这种主要是为了解决加密文件冲突的问题。zentaoPHP框架在处理model的扩展时，会把相应的代码进行合并，但这时候问题就来了。如果对第一种方法的扩展，也就是ext/model/abc.php进行加密，就会和其他的开源的model扩展冲突。如果不加密，无法保护作者的代码。为了解决这个问题，我们特地实现了第三种扩展方法，下面我们来说明下： 

3.1 在extension/custom/下对应模块的 ext/model/class 目录创建一个类，文件名的规则是插件名.class.php。
 比如我们的甘特图插件，定义为project/ext/model/class/gantt.class.php，里面定义各种代码。 
 类名规则是{插件名}{模块名}，模块名首字母大写，如ganttProject。 

```
class ganttProject extends projectModel
{
    public function createRelationOfTasks($projectID)
    {
    }
}

```

 注意：这个地方类是继承自projectModel，这样还可以重用原来的代码。 

3.2 在ext/model/创建调用的程序。比如叫做extension/custom/project/ext/model/gantt.php

```
public function createRelationOfTasks($projectID)
{
    $this->loadExtension('gantt')->createRelationOfTasks($projectID);
}

```
通过loadExtension()方法来调用3.1里面调用的gantt.class.php里面的方法。

这样禅道框架只需要对所有的class扩展进行加密就可以了，就可以解决加密文件冲突的问题了。

二、模型子层 tao

 tao层方法的扩展相对比较容易，只需要定义方法就可以。如果该方法已经在模块中定义过就会覆盖，如果之前没有定义过就是新增。 
 新增 extension/custom/user/ext/tao/xxx.php，其中 xxx.php为插件名。 

```
protected function getTodoList()
{
    return $this->dao->select('*')->from(TABLE_TODO)->fetchAll();
}
```

 需要说明的是这里面的定义不包含类的声明，就只是一个方法的声明。 
 model层同样可以通过 $this->userTao->getTodoList(); 进行调用。
