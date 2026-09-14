# 新增模型层(model/tao)

## 一、模型层 model
文件位置
 禅道的模型层在model.php文件里编写，主要用来处理各种数据的查询、更新。 
 还是以oa模块为例，新增一个extension/custom/oa/model.php文件。

代码编写

 在model.php文件里创建一个名称为：模块名+'Model' 的类，继承自model类。model类是禅道框架的基础类，可以在framework/model.class.php查看具体实现。 
 比如oa模块： 

```
<?php
class oaModel extends model
{
    public function getList()
    {
        return $this->dao->select('*')->from(TABLE_TODO)->fetchAll();
    }
}
```

1. 通过dao访问数据库
 dao的写法跟SQL非常相似，详细的介绍请参阅dao文档：https://www.zentao.net/book/extension-dev/dao-1332.html (https://www.zentao.net/book/extension-dev/dao-1332.html)。 

2. control层调用model方法
 model层的代码需要被control层调用才能执行，调用的方式分两种： 

相同模块的control类方法，可以直接调用，比如 $this->oa->getList(); 
其他模块的control类方法，需要先load该model。
 比如在user模块，使用方式如下： 

```
<?php
class user extends control
{
    public function xxx()
    {
        $this->loadModel('oa');
        $oaList = $this->oa->getList();
        ...
    }
}
```

## 二、模型子层tao

 tao层是禅道20版本之后增加的新的逻辑分层，主要解决的是mdel层代码臃肿，将model层的子逻辑放在tao层。注意：tao层是可选的。

文件位置
新增模块的zen层需要在 extension/custom/xxx 目录下新增一个 tao.php 文件，比如 extension/custom/oa/tao.php。 

代码编写
 在tao.php文件里声明一个名为 模块名 + 'Tao' 的类，继承自该模块的model类，比如oa模块就继承上面model层增加的oaModel类。 
 因此tao跟model一样可以调用dao访问数据库。 

```
<?php
class oaTao extends oaModel
{
    public function getList()
    {
        return $this->dao->select('*')->from(TABLE_TODO)->fetchAll();
    }
} 
```
model层可以通过诸如 $this->oaTao->getList(); 的方式调用 tao 层的方法。

## 三、限制
 由于框架加载机制的限制，每个新模块只能有一个model类和tao类。
